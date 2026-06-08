import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootTabParamList = {
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  LovePlant: NavigatorScreenParams<LovePlantStackParamList>;
  Location: NavigatorScreenParams<LocationStackParamList>;
  PartnerChat: undefined;
  Profile: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  Mood: undefined;
  Meals: undefined;
  Water: undefined;
  Memories: undefined;
  SecretNotes: undefined;
  WeeklySummary: undefined;
  LoveNotes: undefined;
  PartnerProfile: undefined;
  Chat: undefined;
};

export type LocationStackParamList = {
  LocationMap: undefined;
  LocationHistory: undefined;
  GeofenceManager: undefined;
};

export type LovePlantStackParamList = {
  PlantView: undefined;
  PlantHistory: undefined;
  PlantComparison: undefined;
  PlantAchievements: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PartnerLinking: undefined;
};
