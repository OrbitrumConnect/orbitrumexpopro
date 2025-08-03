import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, TOKEN_PACKAGES, formatCurrency, formatTokens } from '../../../shared/schema'
import { X, Zap, CreditCard, QrCode, Copy, Check } from 'lucide-react'

interface TokensPurchaseTriggerProps {
  onClose: () => void
  user: User | null
}

const TokensPurchaseTrigger: React.FC<TokensPurchaseTriggerProps> = ({ onClose, user }) => {
  const [selectedPackage, setSelectedPackage] = useState(TOKEN_PACKAGES[0])
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixData, setPixData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handlePurchase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payment/create-pix-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          tokens: selectedPackage.totalTokens,
          userId: user?.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPixData(data)
        setShowPixModal(true)
      } else {
        console.error('Erro ao gerar PIX')
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.pixCode) {
      try {
        await navigator.clipboard.writeText(pixData.pixCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Erro ao copiar código PIX')
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <Zap className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">Comprar Tokens</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            {user && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Usuário atual:</p>
                <p className="font-semibold">{user.username || user.email}</p>
              </div>
            )}

            {/* Package Selection */}
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900">Escolha um pacote:</h3>
              {TOKEN_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPackage.id === pkg.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                      <p className="text-sm text-gray-600">Pacote {pkg.name}</p>
                      <div className="flex items-center mt-2">
                        <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">
                          {formatTokens(pkg.totalTokens)} tokens
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(pkg.price)}
                      </p>
                      {pkg.popular && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar com PIX
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* PIX Modal */}
        <AnimatePresence>
          {showPixModal && pixData && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                {/* Header */}
                <div className="text-center mb-6">
                  <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Pagamento PIX</h3>
                  <p className="text-sm text-gray-600">
                    Escaneie o QR Code ou copie o código PIX
                  </p>
                </div>

                {/* QR Code */}
                {pixData.qrCode && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={pixData.qrCode}
                      alt="QR Code PIX"
                      className="w-48 h-48 border border-gray-200 rounded-lg"
                    />
                  </div>
                )}

                {/* PIX Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código PIX:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={pixData.pixCode || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyPixCode}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(selectedPackage.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Tokens:</span>
                    <span className="font-semibold">
                      {formatTokens(selectedPackage.totalTokens)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPixModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => {
                      setShowPixModal(false)
                      onClose()
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Concluído
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default TokensPurchaseTrigger 