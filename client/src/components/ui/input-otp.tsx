"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps {
  value: string
  onChange: (value: string) => void
  length?: number
  className?: string
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ value, onChange, length = 6, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {Array.from({ length }).map((_, index) => (
        <InputOTPSlot
          key={index}
          char={value[index] || ""}
          isActive={index === value.length}
          onInput={(char) => {
            const newValue = value.slice(0, index) + char + value.slice(index + 1)
            onChange(newValue.slice(0, length))
          }}
        />
      ))}
    </div>
  )
)
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

interface InputOTPSlotProps {
  char: string
  isActive: boolean
  onInput: (char: string) => void
  className?: string
}

const InputOTPSlot = React.forwardRef<HTMLInputElement, InputOTPSlotProps>(
  ({ char, isActive, onInput, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="text"
        maxLength={1}
        value={char}
        onChange={(e) => onInput(e.target.value)}
        className={cn(
          "relative h-10 w-10 text-center text-base font-medium rounded-md border border-input bg-background text-foreground shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive && "z-10 ring-2 ring-ring ring-offset-2",
          className
        )}
        {...props}
      />
    )
  }
)
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    -
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
