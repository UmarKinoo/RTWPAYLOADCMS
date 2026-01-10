'use client'

import { useState, useMemo, useEffect } from 'react'
import * as React from 'react'
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, Controller, useWatch } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input'
import { format, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import { cn } from '@/lib/utils'
import type { CandidateFormData } from '../RegistrationWizard'
import 'react-phone-number-input/style.css'

interface PersonalInfoStepProps {
  register: UseFormRegister<CandidateFormData>
  errors: FieldErrors<CandidateFormData>
  control: Control<CandidateFormData>
  sameAsPhone: boolean
  setSameAsPhone: (value: boolean) => void
  phone: string
  setValue: UseFormSetValue<CandidateFormData>
}

export function PersonalInfoStep({
  register,
  errors,
  control,
  sameAsPhone,
  setSameAsPhone,
  phone,
  setValue,
}: PersonalInfoStepProps) {
  const watchedDob = useWatch({ control, name: 'dob' })
  
  // Initialize state from watched value
  const getInitialDobDate = () => {
    if (!watchedDob) return undefined
    try {
      const date = new Date(watchedDob)
      return isValid(date) ? date : undefined
    } catch {
      return undefined
    }
  }
  
  const getInitialDobInput = () => {
    if (!watchedDob) return ''
    try {
      const date = new Date(watchedDob)
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd')
      }
    } catch {}
    return watchedDob
  }
  
  const [dobDate, setDobDate] = useState<Date | undefined>(getInitialDobDate())
  const [dobInputValue, setDobInputValue] = useState<string>(getInitialDobInput())
  
  // Sync with watched value changes
  useEffect(() => {
    if (watchedDob) {
      try {
        const date = new Date(watchedDob)
        if (isValid(date)) {
          const formatted = format(date, 'yyyy-MM-dd')
          if (formatted !== dobInputValue) {
            setDobInputValue(formatted)
            setDobDate(date)
          }
        }
      } catch {}
    } else if (dobInputValue && !watchedDob) {
      setDobInputValue('')
      setDobDate(undefined)
    }
  }, [watchedDob, dobInputValue])
  const [locationCountryCode, setLocationCountryCode] = useState<string>('MU') // Mauritius default
  const [showOtherLocation, setShowOtherLocation] = useState(false)
  const [locationSearchOpen, setLocationSearchOpen] = useState(false)
  const [locationCountrySearchOpen, setLocationCountrySearchOpen] = useState(false)
  const [nationalitySearchOpen, setNationalitySearchOpen] = useState(false)

  // Get all countries for nationality
  const countries = useMemo(() => Country.getAllCountries(), [])

  // Get cities for Mauritius (default) or selected country
  const cities = useMemo(() => {
    const countryCities = City.getCitiesOfCountry(locationCountryCode) || []
    // Create unique keys by combining city name with state code to handle duplicates
    return countryCities.map((city, index) => ({
      value: city.name,
      label: city.name,
      key: `${city.name}-${city.stateCode || index}-${locationCountryCode}`,
      stateCode: city.stateCode,
    }))
  }, [locationCountryCode])

  // Get country flag emoji from ISO code
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return ''
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    } catch {
      return ''
    }
  }

  const handleDobChange = (date: Date | undefined) => {
    setDobDate(date)
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      setDobInputValue(formattedDate)
      setValue('dob', formattedDate, { shouldValidate: true })
    } else {
      setDobInputValue('')
      setValue('dob', '', { shouldValidate: true })
    }
  }

  const handleDobInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDobInputValue(value)
    
    if (value) {
      // Native date input provides value in yyyy-MM-dd format
      const parsedDate = new Date(value)
      if (isValid(parsedDate) && parsedDate <= new Date()) {
        setDobDate(parsedDate)
        setValue('dob', value, { shouldValidate: true })
      } else {
        setValue('dob', value, { shouldValidate: true })
      }
    } else {
      setDobDate(undefined)
      setValue('dob', '', { shouldValidate: true })
    }
  }

  const handleLocationChange = (value: string) => {
    if (value === 'other') {
      setShowOtherLocation(true)
      setValue('location', '', { shouldValidate: true })
    } else {
      setShowOtherLocation(false)
      setValue('location', value, { shouldValidate: true })
    }
  }

  const handleLocationCountryChange = (countryCode: string) => {
    setLocationCountryCode(countryCode)
    // Clear location when country changes
    setValue('location', '', { shouldValidate: true })
    setShowOtherLocation(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="firstName">First Name *</FieldLabel>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder="Enter your first name"
          />
          {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder="Enter your last name"
          />
          {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
        </Field>
      </div>

      {/* Phone Number and WhatsApp - Same Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Phone Number *</FieldLabel>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <div className="relative [&_.PhoneInputCountryIcon]:!w-6 [&_.PhoneInputCountryIcon]:!h-4 [&_.PhoneInputCountryIconImg]:!w-6 [&_.PhoneInputCountryIconImg]:!h-4">
                <PhoneInput
                  value={field.value}
                  defaultCountry="MU"
                  international
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter phone number"
                  onChange={(value) => {
                    field.onChange(value || '')
                    if (sameAsPhone && value) {
                      setValue('whatsapp', value, { shouldValidate: true })
                    }
                  }}
                />
              </div>
            )}
          />
          {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.whatsapp}>
          <FieldLabel htmlFor="whatsapp">WhatsApp Number</FieldLabel>
          <div className="space-y-2">
            <Controller
              name="whatsapp"
              control={control}
              render={({ field }) => (
                <div className="relative [&_.PhoneInputCountryIcon]:!w-6 [&_.PhoneInputCountryIcon]:!h-4 [&_.PhoneInputCountryIconImg]:!w-6 [&_.PhoneInputCountryIconImg]:!h-4">
                  <PhoneInput
                    value={field.value}
                    defaultCountry="MU"
                    international
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter WhatsApp number if different"
                    disabled={sameAsPhone}
                    onChange={(value) => field.onChange(value || '')}
                  />
                </div>
              )}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsPhone"
                checked={sameAsPhone}
                onCheckedChange={(checked) => {
                  setSameAsPhone(checked === true)
                  if (checked && phone) {
                    setValue('whatsapp', phone, { shouldValidate: true })
                  }
                }}
              />
              <label
                htmlFor="sameAsPhone"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Same as Phone
              </label>
            </div>
          </div>
          {errors.whatsapp && <FieldError>{errors.whatsapp.message}</FieldError>}
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.gender}>
          <FieldLabel htmlFor="gender">Gender *</FieldLabel>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    <span className="flex items-center gap-2">
                      <span>👨</span> Male
                    </span>
                  </SelectItem>
                  <SelectItem value="female">
                    <span className="flex items-center gap-2">
                      <span>👩</span> Female
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.dob}>
          <FieldLabel htmlFor="dob">Date of Birth *</FieldLabel>
          <Input
            id="dob"
            type="date"
            value={dobInputValue}
            onChange={handleDobInputChange}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
          {errors.dob && <FieldError>{errors.dob.message}</FieldError>}
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.nationality}>
          <FieldLabel htmlFor="nationality">Nationality *</FieldLabel>
          <Controller
            name="nationality"
            control={control}
            render={({ field }) => {
              const selectedCountry = countries.find(
                (c) => c.name === field.value
              )
              return (
                <Popover open={nationalitySearchOpen} onOpenChange={setNationalitySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={nationalitySearchOpen}
                      className="w-full justify-between h-10 font-normal"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {selectedCountry ? (
                          <>
                            <span className="text-lg flex-shrink-0" role="img" aria-label={`${selectedCountry.name} flag`}>
                              {getCountryFlag(selectedCountry.isoCode) || selectedCountry.isoCode}
                            </span>
                            <span className="truncate">{selectedCountry.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Select nationality</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {countries.map((country) => {
                            const flag = getCountryFlag(country.isoCode)
                            return (
                              <CommandItem
                                key={country.isoCode}
                                value={country.name}
                                onSelect={() => {
                                  field.onChange(country.name)
                                  setValue('nationality', country.name, { shouldValidate: true })
                                  setNationalitySearchOpen(false)
                                }}
                              >
                                <span className="mr-2 text-lg flex-shrink-0" role="img" aria-label={`${country.name} flag`}>
                                  {flag || country.isoCode}
                                </span>
                                <span>{country.name}</span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          {errors.nationality && <FieldError>{errors.nationality.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.languages}>
          <FieldLabel htmlFor="languages">Languages *</FieldLabel>
          <Input
            id="languages"
            {...register('languages')}
            placeholder="Languages speaking/reading and writing"
          />
          {errors.languages && <FieldError>{errors.languages.message}</FieldError>}
        </Field>
      </div>

      {/* Current Location - Country and City Selector */}
      <Field data-invalid={!!errors.location}>
        <FieldLabel htmlFor="location">Current Location *</FieldLabel>
        <div className="space-y-4">
          {/* Country Selector */}
          <Popover open={locationCountrySearchOpen} onOpenChange={setLocationCountrySearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={locationCountrySearchOpen}
                className="w-full justify-between h-10 font-normal"
              >
                <span className="truncate">
                  {(() => {
                    const selectedCountry = countries.find(
                      (c) => c.isoCode === locationCountryCode
                    )
                    return selectedCountry
                      ? `${getCountryFlag(selectedCountry.isoCode)} ${selectedCountry.name}`
                      : 'Select country'
                  })()}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.isoCode}
                        value={country.name}
                        onSelect={() => {
                          handleLocationCountryChange(country.isoCode)
                          setLocationCountrySearchOpen(false)
                        }}
                      >
                        <span className="mr-2">{getCountryFlag(country.isoCode)}</span>
                        {country.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* City Selector or Other Input */}
          {showOtherLocation ? (
            <Input
              id="location"
              {...register('location')}
              placeholder="Enter your location"
            />
          ) : (
            <Popover open={locationSearchOpen} onOpenChange={setLocationSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationSearchOpen}
                  className="w-full justify-between h-10 font-normal"
                  disabled={!locationCountryCode}
                >
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <span className="truncate">
                        {field.value || 'Select city'}
                      </span>
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search city..." />
                  <CommandList>
                    <CommandEmpty>No city found.</CommandEmpty>
                    <CommandGroup>
                      {cities.length > 0 ? (
                        cities.map((city) => (
                          <CommandItem
                            key={city.key}
                            value={city.value}
                            onSelect={() => {
                              handleLocationChange(city.value)
                              setLocationSearchOpen(false)
                            }}
                          >
                            {city.label}
                            {city.stateCode && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({city.stateCode})
                              </span>
                            )}
                          </CommandItem>
                        ))
                      ) : (
                        <CommandItem disabled>No cities available for this country</CommandItem>
                      )}
                      <CommandItem
                        value="other"
                        onSelect={() => {
                          handleLocationChange('other')
                          setLocationSearchOpen(false)
                        }}
                      >
                        Other
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        {errors.location && <FieldError>{errors.location.message}</FieldError>}
      </Field>
    </div>
  )
}
















