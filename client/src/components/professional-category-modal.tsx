import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfessionalCategoryModalProps {
  isOpen: boolean;
  onComplete: (category: string, specialty: string) => void;
  onCancel: () => void;
  userEmail: string;
}

const categories = [
  {
    id: "casa_construcao",
    name: "🏠 Casa e Construção",
    specialties: [
      "Pedreiro", "Pintor", "Eletricista", "Encanador", "Marceneiro",
      "Arquiteto", "Engenheiro Civil", "Telhadista", "Azulejista", "Jardineiro"
    ]
  },
  {
    id: "tecnologia",
    name: "💻 Tecnologia",
    specialties: [
      "Desenvolvedor Web", "Desenvolvedor Mobile", "Designer UX/UI", "Analista de Sistemas",
      "Técnico em Informática", "Especialista em Redes", "Data Scientist", "DevOps", "Consultor TI"
    ]
  },
  {
    id: "cuidados_pessoais",
    name: "💄 Cuidados Pessoais",
    specialties: [
      "Cabeleireiro", "Manicure", "Esteticista", "Massagista", "Personal Trainer",
      "Nutricionista", "Fisioterapeuta", "Maquiador", "Barbeiro"
    ]
  },
  {
    id: "educacao",
    name: "📚 Educação",
    specialties: [
      "Professor Particular", "Instrutor de Idiomas", "Tutor Acadêmico", "Coach",
      "Instrutor de Música", "Professor de Dança", "Mentor Profissional"
    ]
  },
  {
    id: "servicos_gerais",
    name: "🔧 Serviços Gerais",
    specialties: [
      "Faxineiro", "Motorista", "Entregador", "Segurança", "Cozinheiro",
      "Lavador de Carros", "Organizador", "Pet Sitter", "Cuidador"
    ]
  }
];

export function ProfessionalCategoryModal({ isOpen, onComplete, onCancel, userEmail }: ProfessionalCategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleComplete = async () => {
    if (!selectedCategory || !selectedSpecialty) return;
    
    setLoading(true);
    try {
      await onComplete(selectedCategory, selectedSpecialty);
    } catch (error) {
      console.error('Erro ao completar cadastro profissional:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-md border border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-cyan-400 text-xl font-bold text-center">
            Complete seu Perfil Profissional
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              Bem-vindo ao Orbitrum, <span className="text-cyan-400">{userEmail}</span>!
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Selecione sua área profissional para completar o cadastro
            </p>
          </div>

          {/* Seleção de Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Categoria Principal:
            </label>
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setSelectedSpecialty(""); // Reset specialty when category changes
            }}>
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                <SelectValue placeholder="Escolha sua área..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-600">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-white hover:bg-gray-800">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Especialidade */}
          {selectedCategoryData && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Especialidade:
              </label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                  <SelectValue placeholder="Sua especialidade..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  {selectedCategoryData.specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-white hover:bg-gray-800">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <p className="text-purple-300 text-xs">
              💡 <strong>Próximos passos:</strong>
            </p>
            <ul className="text-purple-200 text-xs mt-1 space-y-1">
              <li>• Complete seu perfil com fotos e descrição</li>
              <li>• Envie documentos de verificação</li>
              <li>• Defina seus preços e disponibilidade</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!selectedCategory || !selectedSpecialty || loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loading ? "Finalizando..." : "Completar Cadastro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}