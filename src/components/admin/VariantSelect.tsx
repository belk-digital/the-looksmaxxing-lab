'use client'

import React from 'react'
import { SelectInput, useFormFields, useField } from '@payloadcms/ui'

export const VariantSelect: React.FC<any> = (props) => {
  const { path, label, required } = props
  
  // useField handles the state of THIS specific field
  const { value, setValue } = useField<string>({ path })
  
  // useFormFields allows us to read the state of OTHER fields in the form
  const allFields = useFormFields(([fields]) => fields)
  
  // Safely extract the variants from the form state. In Payload 3, array values are often integers representing the row count.
  const variantsField = allFields.variants
  const variantCount = typeof variantsField?.value === 'number' 
    ? variantsField.value 
    : (Array.isArray(variantsField?.value) ? variantsField.value.length : 0)

  // Build the options array
  const options = []
  
  if (Array.isArray(variantsField?.value)) {
    // Sometimes it is an actual array
    variantsField.value.forEach((v: any, index: number) => {
      const sku = v?.sku || `Variant ${index + 1}`
      options.push({ label: sku, value: sku })
    })
  } else {
    // Otherwise iterate up to variantCount and read the flat fields
    for (let i = 0; i < variantCount; i++) {
      const sku = allFields[`variants.${i}.sku`]?.value as string
      if (sku) {
        options.push({ label: sku, value: sku })
      }
    }
  }

  // If no variants exist yet, provide a fallback
  if (options.length === 0) {
    options.push({ label: 'No variants added yet', value: 'none' })
  }

  return (
    <div className="field-type select" style={{ marginBottom: '1rem' }}>
      <label className="field-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
        {label || 'Variant SKU'}
        {required && <span className="required" style={{ color: 'red', marginLeft: '0.25rem' }}>*</span>}
      </label>
      <SelectInput
        path={path}
        name={path}
        options={options}
        value={value}
        onChange={(selected) => setValue(selected ? (selected as any).value || selected : '')}
      />
    </div>
  )
}
