"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell, CheckCircle, AlertCircle, Info, Mail } from "lucide-react"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "success" | "error" | "info" | "warning"
  showEmailIcon?: boolean
  showResendButton?: boolean
  onResend?: () => void
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info",
  showEmailIcon = false,
  showResendButton = false,
  onResend
}: NotificationModalProps) {
  const getIcon = () => {
    if (showEmailIcon) {
      return <Mail className="h-6 w-6 text-blue-500" />
    }
    
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          {showResendButton && onResend && (
            <Button onClick={onResend} variant="outline" size="sm">
              Reenviar
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
