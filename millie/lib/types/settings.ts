export interface UserPreferences {
  animacoesInterface: boolean;
  texturaPapel: boolean;
  sonsInterface: boolean;
}

export interface NotificationPreferences {
  novasSessoes: boolean;
  itensAdicionados: boolean;
  habilidadesDesbloqueadas: boolean;
  atualizacoesSistema: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  animacoesInterface: true,
  texturaPapel: true,
  sonsInterface: false,
};

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  novasSessoes: true,
  itensAdicionados: true,
  habilidadesDesbloqueadas: true,
  atualizacoesSistema: false,
};