import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, FileText, Shield, Upload, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

const certificationFormSchema = z.object({
  certificationType: z.string().min(1, "Tipo de certificação é obrigatório"),
  certificationNumber: z.string().min(1, "Número do certificado é obrigatório"),
  issuingAuthority: z.string().min(1, "Órgão emissor é obrigatório"),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  expiryDate: z.string().optional(),
  documentUrl: z.string().url("URL inválida").optional(),
});

type CertificationFormData = z.infer<typeof certificationFormSchema>;

interface CertificationSystemProps {
  professionalId: number;
  category?: string;
  specialty?: string;
}

export function CertificationSystem({ professionalId, category = "Casa e Construção", specialty = "Pintor" }: CertificationSystemProps) {
  const [isAddingCertification, setIsAddingCertification] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues: {
      certificationType: "",
      certificationNumber: "",
      issuingAuthority: "",
      issueDate: "",
      expiryDate: "",
      documentUrl: "",
    },
  });

  // Buscar requisitos de certificação para a categoria/especialidade
  const { data: requirements } = useQuery({
    queryKey: [`/api/certifications/requirements/${category}/${specialty}`],
    enabled: !!(category && specialty),
  });

  // Buscar certificações do profissional
  const { data: certifications, isLoading: certificationsLoading } = useQuery({
    queryKey: [`/api/professionals/${professionalId}/certifications`],
  });

  // Buscar status de conformidade
  const { data: compliance, isLoading: complianceLoading } = useQuery({
    queryKey: [`/api/professionals/${professionalId}/compliance`],
  });

  // Mutation para adicionar certificação
  const addCertificationMutation = useMutation({
    mutationFn: async (data: CertificationFormData) => {
      const response = await apiRequest("POST", `/api/professionals/${professionalId}/certifications`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certificação Adicionada",
        description: "Certificação enviada para validação admin",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/professionals/${professionalId}/certifications`] });
      queryClient.invalidateQueries({ queryKey: [`/api/professionals/${professionalId}/compliance`] });
      setIsAddingCertification(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar certificação",
        variant: "destructive",
      });
    },
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const onSubmit = (data: CertificationFormData) => {
    addCertificationMutation.mutate(data);
  };

  if (certificationsLoading || complianceLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Certificações NR 35
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const complianceData = compliance?.compliance || {};
  const certificationsList = certifications?.certifications || [];
  const requirementsList = requirements?.requirements || [];

  return (
    <div className="space-y-6">
      {/* Status de Conformidade Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Conformidade NR 35
          </CardTitle>
          <CardDescription>
            Acompanhe suas certificações obrigatórias e opcionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${complianceData.isCompliant ? 'text-green-500' : 'text-red-500'}`}>
                {complianceData.isCompliant ? 'CONFORME' : 'NÃO CONFORME'}
              </div>
              <div className="text-sm text-muted-foreground">Status Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {complianceData.validCertifications || 0}
              </div>
              <div className="text-sm text-muted-foreground">Válidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {complianceData.pendingCertifications || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {complianceData.expiringSoon || 0}
              </div>
              <div className="text-sm text-muted-foreground">Expirando</div>
            </div>
          </div>

          {complianceData.requiredCertifications > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso de Conformidade</span>
                <span>{complianceData.validCertifications || 0}/{complianceData.requiredCertifications || 0}</span>
              </div>
              <Progress 
                value={((complianceData.validCertifications || 0) / (complianceData.requiredCertifications || 1)) * 100} 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="my-certifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-certifications">Minhas Certificações</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="my-certifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Certificações Cadastradas</h3>
            <Dialog open={isAddingCertification} onOpenChange={setIsAddingCertification}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Certificação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Certificação</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova certificação profissional
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="certificationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Certificação</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NR35">NR 35 - Trabalho em Altura</SelectItem>
                              <SelectItem value="NR18">NR 18 - Construção Civil</SelectItem>
                              <SelectItem value="NR10">NR 10 - Segurança Elétrica</SelectItem>
                              <SelectItem value="CREA">CREA - Registro Profissional</SelectItem>
                              <SelectItem value="CAU">CAU - Arquitetura</SelectItem>
                              <SelectItem value="CRM">CRM - Medicina</SelectItem>
                              <SelectItem value="OAB">OAB - Advocacia</SelectItem>
                              <SelectItem value="CRC">CRC - Contabilidade</SelectItem>
                              <SelectItem value="CompTIA">CompTIA - TI</SelectItem>
                              <SelectItem value="AWS">AWS - Cloud</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="certificationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Certificado</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: NR35-2024-001234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="issuingAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Órgão Emissor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SENAI, MTE, CREA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Emissão</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Expiração</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="documentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL do Documento (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addCertificationMutation.isPending}
                        className="w-full"
                      >
                        {addCertificationMutation.isPending ? "Salvando..." : "Salvar Certificação"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {certificationsList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma certificação cadastrada</p>
                  <p className="text-sm text-muted-foreground">Adicione suas certificações profissionais</p>
                </CardContent>
              </Card>
            ) : (
              certificationsList.map((cert: any) => (
                <Card key={cert.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(cert.validationStatus)}
                          <h4 className="font-semibold">{cert.certificationType}</h4>
                          <Badge variant={cert.validationStatus === 'approved' ? 'default' : 'secondary'}>
                            {cert.validationStatus === 'approved' ? 'Aprovada' : 
                             cert.validationStatus === 'pending' ? 'Pendente' : 'Rejeitada'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nº {cert.certificationNumber} - {cert.issuingAuthority}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Emitido: {new Date(cert.issueDate).toLocaleDateString('pt-BR')}
                          {cert.expiryDate && ` - Expira: ${new Date(cert.expiryDate).toLocaleDateString('pt-BR')}`}
                        </p>
                        {cert.validationNotes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Observações:</strong> {cert.validationNotes}
                          </p>
                        )}
                      </div>
                      {cert.documentUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <h3 className="text-lg font-semibold">Requisitos para {specialty} - {category}</h3>
          
          <div className="grid gap-4">
            {requirementsList.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum requisito específico definido</p>
                  <p className="text-sm text-muted-foreground">Esta especialidade não possui requisitos obrigatórios</p>
                </CardContent>
              </Card>
            ) : (
              requirementsList.map((req: any) => (
                <Card key={req.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full ${getRiskLevelColor(req.riskLevel)} mt-2`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{req.certificationType}</h4>
                          <Badge variant={req.isRequired ? 'destructive' : 'secondary'}>
                            {req.isRequired ? 'Obrigatório' : 'Opcional'}
                          </Badge>
                          <Badge variant="outline">
                            Risco {req.riskLevel === 'high' ? 'Alto' : req.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {req.description}
                        </p>
                        {req.legalBasis && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Base Legal:</strong> {req.legalBasis}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <h3 className="text-lg font-semibold">Detalhes de Conformidade</h3>
          
          <div className="grid gap-4">
            {(complianceData.details || []).map((detail: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full ${getRiskLevelColor(detail.riskLevel)} mt-2`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(detail.status === 'valid' ? 'approved' : 
                                      detail.status === 'pending_validation' ? 'pending' : 'rejected')}
                        <h4 className="font-semibold">{detail.certificationType}</h4>
                        <Badge variant={
                          detail.status === 'valid' ? 'default' :
                          detail.status === 'pending_validation' ? 'secondary' :
                          detail.status === 'missing' ? 'destructive' : 'outline'
                        }>
                          {detail.status === 'valid' ? 'Válida' :
                           detail.status === 'pending_validation' ? 'Em Validação' :
                           detail.status === 'missing' ? 'Ausente' : detail.status}
                        </Badge>
                        {detail.required && (
                          <Badge variant="destructive" className="text-xs">Obrigatória</Badge>
                        )}
                      </div>
                      
                      {detail.expiryDate && (
                        <p className="text-sm text-muted-foreground">
                          Expira em: {new Date(detail.expiryDate).toLocaleDateString('pt-BR')}
                          {detail.daysToExpiry <= 30 && (
                            <span className="text-red-500 ml-2">
                              ({detail.daysToExpiry} dias restantes)
                            </span>
                          )}
                        </p>
                      )}
                      
                      {detail.status === 'missing' && detail.required && (
                        <p className="text-sm text-red-500 mt-2">
                          ⚠️ Certificação obrigatória não cadastrada
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}