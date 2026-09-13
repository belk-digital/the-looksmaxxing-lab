<?php
/**
 * Plugin Name: Longevia Cross-Site Payment Bridge
 * Description: Receives signed checkout hand-offs from longeviaresearch.com, runs them
 *              through the "Payment Gateway for Authorize.net for WooCommerce" gateway
 *              already configured here, and reports the result back so the origin order
 *              can be finalized.
 * Version: 1.0.0
 *
 * INSTALL: upload this single file to wp-content/mu-plugins/ (create that folder if it
 * doesn't exist yet). Files placed there load automatically — no "activation" step.
 *
 * CONFIGURE (pick one):
 *   - Preferred: add these two lines to wp-config.php, above the
 *     "That's all, stop editing!" comment:
 *       define('LONGEVIA_BRIDGE_SECRET', 'paste-the-same-value-as-CROSS_SITE_PAYMENT_SECRET-here');
 *       define('LONGEVIA_BRIDGE_GATEWAY_ID', 'easyauthnet_authorizenet');
 *   - Or: edit the fallback values directly below.
 *
 * FINDING THE GATEWAY ID: WP Admin -> WooCommerce -> Settings -> Payments -> click
 * "Manage" on the Authorize.net row -> look at the "section=..." part of the URL in
 * your browser's address bar. That exact string is LONGEVIA_BRIDGE_GATEWAY_ID.
 * Confirmed for this store: "easyauthnet_authorizenet".
 */

if (!defined('ABSPATH')) {
    exit;
}

// ---- Configuration --------------------------------------------------------

if (!defined('LONGEVIA_BRIDGE_SECRET')) {
    define('LONGEVIA_BRIDGE_SECRET', 'REPLACE_ME_WITH_SAME_VALUE_AS_CROSS_SITE_PAYMENT_SECRET');
}

if (!defined('LONGEVIA_BRIDGE_ORIGIN_WEBHOOK_URL')) {
    define('LONGEVIA_BRIDGE_ORIGIN_WEBHOOK_URL', 'https://longeviaresearch.com/api/webhooks/cross-site-payment');
}

if (!defined('LONGEVIA_BRIDGE_GATEWAY_ID')) {
    define('LONGEVIA_BRIDGE_GATEWAY_ID', 'easyauthnet_authorizenet');
}

define('LONGEVIA_BRIDGE_MAX_AGE_SECONDS', 600); // reject/expire hand-offs older than 10 minutes
define('LONGEVIA_BRIDGE_ORDER_META_FLAG', '_longevia_bridge_order');
define('LONGEVIA_BRIDGE_META_ORIGIN_ORDER_ID', '_longevia_bridge_origin_order_id');
define('LONGEVIA_BRIDGE_META_RETURN_URL', '_longevia_bridge_return_url');
define('LONGEVIA_BRIDGE_META_CANCEL_URL', '_longevia_bridge_cancel_url');
define('LONGEVIA_BRIDGE_META_AFFILIATE_ID', '_longevia_bridge_affiliate_id');
define('LONGEVIA_BRIDGE_META_CLICK_ID', '_longevia_bridge_click_id');
define('LONGEVIA_BRIDGE_NONCE_PREFIX', 'longevia_bridge_nonce_');

// ---- Helpers ----------------------------------------------------------------

function longevia_bridge_base64url_decode($data) {
    $data = strtr($data, '-_', '+/');
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode($data);
}

// ---- REST endpoint: receive the hand-off from longeviaresearch.com ----------

add_action('rest_api_init', function () {
    register_rest_route('longevia-bridge/v1', '/pay', [
        'methods'             => 'POST',
        'callback'            => 'longevia_bridge_handle_pay_request',
        'permission_callback' => '__return_true',
    ]);
});

function longevia_bridge_handle_pay_request(WP_REST_Request $request) {
    if (!function_exists('wc_create_order')) {
        return new WP_Error('longevia_bridge_no_woocommerce', 'WooCommerce is not active.', ['status' => 500]);
    }

    $encoded_payload = $request->get_param('payload');
    $signature = $request->get_param('sig');

    if (!is_string($encoded_payload) || $encoded_payload === '' || !is_string($signature) || $signature === '') {
        return new WP_Error('longevia_bridge_bad_request', 'Missing payload or signature.', ['status' => 400]);
    }

    // Verify the signature over the untouched payload string first — never trust the
    // decoded contents until this passes. Signing one opaque string like this (rather
    // than the individual POST fields) is deliberate: reconstructing the original JSON
    // from form-decoded fields on this side wouldn't reliably reproduce the exact bytes
    // that were hashed on the Next.js side (number vs. string types, key order), so the
    // signed material has to travel as a single string instead.
    $expected_signature = hash_hmac('sha256', $encoded_payload, LONGEVIA_BRIDGE_SECRET);
    if (!hash_equals($expected_signature, (string) $signature)) {
        return new WP_Error('longevia_bridge_invalid_signature', 'Invalid signature.', ['status' => 400]);
    }

    $decoded = json_decode(longevia_bridge_base64url_decode($encoded_payload), true);
    if (!is_array($decoded)) {
        return new WP_Error('longevia_bridge_bad_payload', 'Malformed payload.', ['status' => 400]);
    }

    $required = ['orderId', 'orderNumber', 'amountCents', 'currency', 'returnUrl', 'cancelUrl', 'nonce', 'ts'];
    foreach ($required as $key) {
        if (!isset($decoded[$key]) || $decoded[$key] === '') {
            return new WP_Error('longevia_bridge_bad_payload', "Missing field: {$key}", ['status' => 400]);
        }
    }

    if (abs(time() - ((int) $decoded['ts'] / 1000)) > LONGEVIA_BRIDGE_MAX_AGE_SECONDS) {
        return new WP_Error('longevia_bridge_expired', 'This payment link has expired. Please return to checkout and try again.', ['status' => 400]);
    }

    $nonce_key = LONGEVIA_BRIDGE_NONCE_PREFIX . md5((string) $decoded['nonce']);
    if (get_transient($nonce_key)) {
        return new WP_Error('longevia_bridge_replay', 'This payment link has already been used.', ['status' => 400]);
    }
    set_transient($nonce_key, 1, LONGEVIA_BRIDGE_MAX_AGE_SECONDS);

    if (strtoupper((string) $decoded['currency']) !== get_woocommerce_currency()) {
        return new WP_Error('longevia_bridge_currency_mismatch', 'Currency mismatch between sites.', ['status' => 400]);
    }

    $amount = round(((int) $decoded['amountCents']) / 100, 2);
    if ($amount <= 0) {
        return new WP_Error('longevia_bridge_bad_amount', 'Invalid amount.', ['status' => 400]);
    }

    $order = wc_create_order();

    $fee = new WC_Order_Item_Fee();
    $fee->set_name(sprintf('Longevia Research Order #%s', sanitize_text_field((string) $decoded['orderNumber'])));
    $fee->set_amount($amount);
    $fee->set_total($amount);
    $fee->set_tax_status('none');
    $order->add_item($fee);

    if (!empty($decoded['email'])) {
        $order->set_billing_email(sanitize_email($decoded['email']));
    }
    if (!empty($decoded['firstName'])) {
        $order->set_billing_first_name(sanitize_text_field($decoded['firstName']));
    }
    if (!empty($decoded['lastName'])) {
        $order->set_billing_last_name(sanitize_text_field($decoded['lastName']));
    }

    $order->update_meta_data(LONGEVIA_BRIDGE_ORDER_META_FLAG, 1);
    $order->update_meta_data(LONGEVIA_BRIDGE_META_ORIGIN_ORDER_ID, sanitize_text_field((string) $decoded['orderId']));
    $order->update_meta_data(LONGEVIA_BRIDGE_META_RETURN_URL, esc_url_raw($decoded['returnUrl']));
    $order->update_meta_data(LONGEVIA_BRIDGE_META_CANCEL_URL, esc_url_raw($decoded['cancelUrl']));
    if (!empty($decoded['affiliateId'])) {
        $order->update_meta_data(LONGEVIA_BRIDGE_META_AFFILIATE_ID, sanitize_text_field($decoded['affiliateId']));
    }
    if (!empty($decoded['clickId'])) {
        $order->update_meta_data(LONGEVIA_BRIDGE_META_CLICK_ID, sanitize_text_field($decoded['clickId']));
    }

    $order->calculate_totals();
    $order->set_status('pending');
    $order->add_order_note('Created via the Longevia Research cross-site payment bridge.');
    $order->save();

    wp_safe_redirect($order->get_checkout_payment_url());
    exit;
}

// ---- Restrict the pay-for-order page to just the Authorize.net gateway ------

add_filter('woocommerce_available_payment_gateways', function ($gateways) {
    if (is_admin()) {
        return $gateways;
    }

    $order_id = absint(get_query_var('order-pay'));
    if (!$order_id) {
        return $gateways;
    }

    $order = wc_get_order($order_id);
    if (!$order || !$order->get_meta(LONGEVIA_BRIDGE_ORDER_META_FLAG)) {
        return $gateways;
    }

    if (isset($gateways[LONGEVIA_BRIDGE_GATEWAY_ID])) {
        return [LONGEVIA_BRIDGE_GATEWAY_ID => $gateways[LONGEVIA_BRIDGE_GATEWAY_ID]];
    }

    // LONGEVIA_BRIDGE_GATEWAY_ID doesn't match any enabled gateway - most likely
    // misconfigured. Fail open (show whatever is enabled) rather than leaving a
    // paying customer stuck on a blank payment page; this will be obvious in testing.
    return $gateways;
}, 20);

// ---- Send the customer back to longeviaresearch.com instead of our own thank-you page ----

add_filter('woocommerce_get_checkout_order_received_url', function ($url, $order) {
    if ($order && $order->get_meta(LONGEVIA_BRIDGE_ORDER_META_FLAG)) {
        $return_url = $order->get_meta(LONGEVIA_BRIDGE_META_RETURN_URL);
        if ($return_url) {
            return $return_url;
        }
    }
    return $url;
}, 10, 2);

add_filter('woocommerce_get_cancel_order_url', function ($url, $order, $redirect = '') {
    if ($order && $order->get_meta(LONGEVIA_BRIDGE_ORDER_META_FLAG)) {
        $cancel_url = $order->get_meta(LONGEVIA_BRIDGE_META_CANCEL_URL);
        if ($cancel_url) {
            return $cancel_url;
        }
    }
    return $url;
}, 10, 3);

// ---- Report success back to longeviaresearch.com so it can finalize the order ----

function longevia_bridge_send_confirmation($order_id, $attempt = 1) {
    $order = wc_get_order($order_id);
    if (!$order || !$order->get_meta(LONGEVIA_BRIDGE_ORDER_META_FLAG)) {
        return;
    }
    if ($order->get_meta('_longevia_bridge_confirmed')) {
        return; // already reported successfully
    }

    $origin_order_id = $order->get_meta(LONGEVIA_BRIDGE_META_ORIGIN_ORDER_ID);
    if (!$origin_order_id) {
        return;
    }

    $body = wp_json_encode([
        'orderId'     => $origin_order_id,
        'amountCents' => (int) round($order->get_total() * 100),
        'status'      => 'succeeded',
        'txnId'       => $order->get_transaction_id(),
        'affiliateId' => $order->get_meta(LONGEVIA_BRIDGE_META_AFFILIATE_ID) ?: null,
        'clickId'     => $order->get_meta(LONGEVIA_BRIDGE_META_CLICK_ID) ?: null,
    ]);

    $signature = hash_hmac('sha256', $body, LONGEVIA_BRIDGE_SECRET);

    $response = wp_remote_post(LONGEVIA_BRIDGE_ORIGIN_WEBHOOK_URL, [
        'headers' => [
            'Content-Type'          => 'application/json',
            'X-Longevia-Signature'  => $signature,
        ],
        'body'    => $body,
        'timeout' => 15,
    ]);

    $ok = !is_wp_error($response) && (int) wp_remote_retrieve_response_code($response) === 200;

    if ($ok) {
        $order->update_meta_data('_longevia_bridge_confirmed', 1);
        $order->save();
        return;
    }

    $failure_reason = is_wp_error($response)
        ? $response->get_error_message()
        : sprintf('HTTP %d - %s', wp_remote_retrieve_response_code($response), wp_remote_retrieve_body($response));

    if ($attempt < 5) {
        $order->add_order_note(sprintf('Longevia bridge: confirmation attempt %d failed (%s). Retrying shortly.', $attempt, $failure_reason));
        wp_schedule_single_event(time() + ($attempt * 300), 'longevia_bridge_retry_confirmation', [$order_id, $attempt + 1]);
    } else {
        $order->add_order_note(sprintf('Longevia bridge: failed to notify origin site after %d attempts (last error: %s). Needs manual reconciliation.', $attempt, $failure_reason));
    }
}
add_action('longevia_bridge_retry_confirmation', 'longevia_bridge_send_confirmation', 10, 2);

add_action('woocommerce_payment_complete', function ($order_id) {
    longevia_bridge_send_confirmation($order_id, 1);
});
