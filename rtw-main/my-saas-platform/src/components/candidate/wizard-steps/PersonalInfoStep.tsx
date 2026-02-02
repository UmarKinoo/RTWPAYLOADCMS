'use client'

import { useState, useMemo, useEffect } from 'react'
import * as React from 'react'
import { UseFormRegister, FieldErrors, Control, UseFormSetValue, Controller, useWatch } from 'react-hook-form'
import { useTranslations } from 'next-intl'
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
  const KSA_COUNTRY_CODE = 'SA'
  const [locationCountryCode] = useState<string>(KSA_COUNTRY_CODE) // Fixed to Saudi Arabia
  const [showOtherLocation, setShowOtherLocation] = useState(false)
  const [locationSearchOpen, setLocationSearchOpen] = useState(false)
  const t = useTranslations('registration.location')
  const p = useTranslations('registration.personalInfo')
  const [nationalitySearchOpen, setNationalitySearchOpen] = useState(false)

  // Get all countries for nationality
  const countries = useMemo(() => Country.getAllCountries(), [])

  // Get cities for Saudi Arabia (fixed), deduplicated by name
  const cities = useMemo(() => {
    const countryCities = City.getCitiesOfCountry(locationCountryCode) || []
    const seen = new Set<string>()
    return countryCities
      .filter((city) => {
        const name = (city.name || '').trim()
        if (!name || seen.has(name)) return false
        seen.add(name)
        return true
      })
      .map((city, index) => ({
        value: city.name,
        label: city.name,
        key: `ksa-city-${city.name}-${index}`,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="firstName">{p('firstName')}</FieldLabel>
          <Input
            id="firstName"
            {...register('firstName')}
            placeholder={p('placeholderFirstName')}
          />
          {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="lastName">{p('lastName')}</FieldLabel>
          <Input
            id="lastName"
            {...register('lastName')}
            placeholder={p('placeholderLastName')}
          />
          {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
        </Field>
      </div>

      {/* Phone Number and WhatsApp - Same Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">{p('phoneNumber')}</FieldLabel>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <div className="relative [&_.PhoneInputCountryIcon]:!w-6 [&_.PhoneInputCountryIcon]:!h-4 [&_.PhoneInputCountryIconImg]:!w-6 [&_.PhoneInputCountryIconImg]:!h-4">
                <PhoneInput
                  value={field.value}
                  defaultCountry="SA"
                  countries={['SA']}
                  international
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={p('placeholderPhone')}
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
          <FieldLabel htmlFor="whatsapp">{p('whatsappNumber')}</FieldLabel>
          <div className="space-y-2">
            <Controller
              name="whatsapp"
              control={control}
              render={({ field }) => (
                <div className="relative [&_.PhoneInputCountryIcon]:!w-6 [&_.PhoneInputCountryIcon]:!h-4 [&_.PhoneInputCountryIconImg]:!w-6 [&_.PhoneInputCountryIconImg]:!h-4">
                  <PhoneInput
                    value={field.value}
                    defaultCountry="SA"
                    countries={['SA']}
                    international
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={p('placeholderWhatsAppDifferent')}
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
                {p('sameAsPhone')}
              </label>
            </div>
          </div>
          {errors.whatsapp && <FieldError>{errors.whatsapp.message}</FieldError>}
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field data-invalid={!!errors.gender}>
          <FieldLabel htmlFor="gender">{p('gender')}</FieldLabel>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder={p('selectGender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    <span className="flex items-center gap-2">
                      <span>👨</span> {p('male')}
                    </span>
                  </SelectItem>
                  <SelectItem value="female">
                    <span className="flex items-center gap-2">
                      <span>👩</span> {p('female')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.dob}>
          <FieldLabel htmlFor="dob">{p('dateOfBirth')}</FieldLabel>
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
          <FieldLabel htmlFor="nationality">{p('nationality')}</FieldLabel>
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
                          <span className="text-muted-foreground">{p('selectNationality')}</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={p('searchCountry')} />
                      <CommandList>
                        <CommandEmpty>{p('noCountryFound')}</CommandEmpty>
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
                                className="data-[highlighted]:text-white data-[selected=true]:text-white"
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
          <FieldLabel htmlFor="languages">{p('languages')}</FieldLabel>
          <Input
            id="languages"
            {...register('languages')}
            placeholder={p('placeholderLanguages')}
          />
          {errors.languages && <FieldError>{errors.languages.message}</FieldError>}
        </Field>
      </div>

      {/* Current Location - Fixed to Saudi Arabia, city selector only */}
      <Field data-invalid={!!errors.location}>
        <FieldLabel htmlFor="location">{t('currentLocationLabel')}</FieldLabel>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {getCountryFlag(KSA_COUNTRY_CODE)} {t('countryFixed')}
          </p>
          {showOtherLocation ? (
            <Input
              id="location"
              {...register('location')}
              placeholder={t('enterLocationPlaceholder')}
            />
          ) : (
            <Popover open={locationSearchOpen} onOpenChange={setLocationSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationSearchOpen}
                  className="w-full justify-between h-10 font-normal"
                >
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <span className="truncate">
                        {field.value || t('selectCity')}
                      </span>
                    )}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={t('searchCity')} />
                  <CommandList>
                    <CommandEmpty>{t('noCityFound')}</CommandEmpty>
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
                        <CommandItem disabled>{t('noCitiesAvailable')}</CommandItem>
                      )}
                      <CommandItem
                        value="other"
                        onSelect={() => {
                          handleLocationChange('other')
                          setLocationSearchOpen(false)
                        }}
                      >
                        {t('other')}
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

      {/* Confirm currently in Saudi Arabia */}
      <Field data-invalid={!!errors.currentlyInKSA}>
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Controller
            name="currentlyInKSA"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="currentlyInKSA"
                checked={field.value || false}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
            )}
          />
          <label
            htmlFor="currentlyInKSA"
            className="text-sm leading-relaxed cursor-pointer flex-1"
          >
            {t('confirmInKSA')} *
          </label>
        </div>
        {errors.currentlyInKSA && (
          <FieldError>{errors.currentlyInKSA.message}</FieldError>
        )}
      </Field>
    </div>
  )
}
















