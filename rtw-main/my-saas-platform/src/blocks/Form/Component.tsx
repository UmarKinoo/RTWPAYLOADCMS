'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'
import type { FormBlock as FormBlockProps } from '@/payload-types'

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'

import { fields } from './fields'
import { getClientSideURL } from '@/utilities/getURL'
import { Container } from '@/components/ds'

export const FormBlock: React.FC<FormBlockProps> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    introContent,
  } = props

  // Handle form being either a number (ID) or Form object
  // In practice, with proper depth, it should be populated, but we need to handle both
  const form = typeof formFromProps === 'object' ? formFromProps : null
  const formID = typeof formFromProps === 'object' ? formFromProps.id : formFromProps
  const confirmationMessage = form?.confirmationMessage
  const confirmationType = form?.confirmationType
  const redirect = form?.redirect
  const submitButtonLabel = form?.submitButtonLabel

  // If form is not available (shouldn't happen with proper depth), show error
  if (!form) {
    return (
      <section className="w-full">
        <Container>
          <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
            <div>Form not found. Please ensure the form relationship is properly populated.</div>
          </div>
        </Container>
      </section>
    )
  }

  // Type assertion needed because Payload types allow null but FormFieldBlock doesn't
  // In practice, blockName will be string or undefined at runtime
  const formMethods = useForm<Record<string, any>>({
    defaultValues: (form.fields || []) as any,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: Record<string, any>) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <section className="w-full">
      <Container>
        <div className="lg:max-w-[48rem] mx-auto">
          {enableIntro === true && introContent && !hasSubmitted && (
            <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
          )}
          <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === 'message' && confirmationMessage && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || '500'}: ${error.message || ''}`}</div>}
          {!hasSubmitted && (
            <form id={String(formID)} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {form &&
                  form.fields &&
                  form.fields?.map((field, index) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
                    if (Field) {
                      return (
                        <div className="mb-6 last:mb-0" key={index}>
                          <Field
                            form={form}
                            {...field}
                            {...formMethods}
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              <Button form={String(formID)} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
          </div>
        </div>
      </Container>
    </section>
  )
}
