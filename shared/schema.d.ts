export declare const SAMPLE_USERS: ({
    id: number;
    username: string;
    email: string;
    userType: "admin";
    tokens: number;
    plan: "max";
    credits: number;
    maxCredits: number;
    highScore: number;
    adminLevel: number;
    documentsStatus: "approved";
    canMakePurchases: boolean;
    suspended: boolean;
    banned: boolean;
    termsAccepted: boolean;
    tokensPlano: number;
    tokensGanhos: number;
    tokensComprados: number;
    tokensUsados: number;
    creditosAcumulados: number;
    creditosSacados: number;
    saqueDisponivel: number;
    notificacaoSaque: boolean;
    freePlanAiSearches: number;
    freePlanPlanetViews: number;
    freePlanProfileViews: number;
    freePlanMessages: number;
} | {
    id: number;
    username: string;
    email: string;
    userType: "client";
    tokens: number;
    plan: "free";
    credits: number;
    maxCredits: number;
    highScore: number;
    adminLevel: number;
    documentsStatus: "approved";
    canMakePurchases: boolean;
    suspended: boolean;
    banned: boolean;
    termsAccepted: boolean;
    tokensPlano: number;
    tokensGanhos: number;
    tokensComprados: number;
    tokensUsados: number;
    creditosAcumulados: number;
    creditosSacados: number;
    saqueDisponivel: number;
    notificacaoSaque: boolean;
    freePlanAiSearches: number;
    freePlanPlanetViews: number;
    freePlanProfileViews: number;
    freePlanMessages: number;
} | {
    id: number;
    username: string;
    email: string;
    userType: "client";
    tokens: number;
    plan: "max";
    credits: number;
    maxCredits: number;
    highScore: number;
    adminLevel: number;
    documentsStatus: "approved";
    canMakePurchases: boolean;
    suspended: boolean;
    banned: boolean;
    termsAccepted: boolean;
    tokensPlano: number;
    tokensGanhos: number;
    tokensComprados: number;
    tokensUsados: number;
    creditosAcumulados: number;
    creditosSacados: number;
    saqueDisponivel: number;
    notificacaoSaque: boolean;
    freePlanAiSearches: number;
    freePlanPlanetViews: number;
    freePlanProfileViews: number;
    freePlanMessages: number;
})[];
export declare const SAMPLE_PROFESSIONALS: ({
    id: number;
    userId: number;
    name: string;
    title: string;
    description: string;
    skills: string[];
    services: string[];
    servicesPricing: number[];
    city: string;
    state: string;
    rating: number;
    reviewCount: number;
    avatar: string;
    orbitRing: number;
    orbitPosition: number;
    available: boolean;
    workRadius: number;
    latitude: number;
    longitude: number;
    hourlyRate: number;
    verified: boolean;
    experience: string;
    education: string;
    certifications: string[];
    languages: string[];
    specialties: string[];
    portfolio: string[];
    availability: {
        monday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        tuesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        wednesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        thursday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        friday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        saturday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        sunday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
    };
} | {
    id: number;
    userId: number;
    name: string;
    title: string;
    description: string;
    skills: string[];
    services: string[];
    city: string;
    state: string;
    rating: number;
    reviewCount: number;
    avatar: string;
    orbitRing: number;
    orbitPosition: number;
    available: boolean;
    workRadius: number;
    latitude: number;
    longitude: number;
    hourlyRate: number;
    verified: boolean;
    experience: string;
    education: string;
    certifications: string[];
    languages: string[];
    specialties: string[];
    portfolio: string[];
    availability: {
        monday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        tuesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        wednesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        thursday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        friday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        saturday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        sunday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
    };
    servicesPricing?: never;
} | {
    id: number;
    userId: number;
    name: string;
    title: string;
    description: string;
    skills: string[];
    city: string;
    state: string;
    rating: number;
    reviewCount: number;
    avatar: string;
    orbitRing: number;
    orbitPosition: number;
    available: boolean;
    workRadius: number;
    latitude: number;
    longitude: number;
    hourlyRate: number;
    verified: boolean;
    experience: string;
    education: string;
    certifications: string[];
    languages: string[];
    specialties: string[];
    portfolio: string[];
    availability: {
        monday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        tuesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        wednesday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        thursday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        friday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        saturday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
        sunday: {
            morning: boolean;
            afternoon: boolean;
            evening: boolean;
        };
    };
    services?: never;
    servicesPricing?: never;
})[];
export declare const TOKEN_PACKAGES: ({
    id: string;
    name: string;
    price: number;
    baseTokens: number;
    bonusTokens: number;
    totalTokens: number;
    icon: string;
    popular?: never;
} | {
    id: string;
    name: string;
    price: number;
    baseTokens: number;
    bonusTokens: number;
    totalTokens: number;
    icon: string;
    popular: boolean;
})[];
export declare const formatCurrency: (value: number) => string;
export declare const formatTokens: (tokens: number) => string;
export declare const getTotalTokens: (user: any) => number;
export type User = typeof SAMPLE_USERS[0];
export type Professional = typeof SAMPLE_PROFESSIONALS[0];
export type TokenPackage = typeof TOKEN_PACKAGES[0];
//# sourceMappingURL=schema.d.ts.map