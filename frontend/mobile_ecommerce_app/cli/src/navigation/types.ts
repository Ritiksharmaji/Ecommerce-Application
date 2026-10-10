import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps, NavigatorScreenParams} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

/** Bottom tabs of the shop. */
export type MainTabParamList = {
  Home: undefined;
  Cart: undefined;
  Favorites: undefined;
  Profile: undefined;
};

/** Admin › Products tab. */
export type AdminProductsStackParamList = {
  ProductsList: undefined;
  AddProduct: undefined;
  EditProduct: {productId: string};
};

/** Admin panel tabs. */
export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminProducts: NavigatorScreenParams<AdminProductsStackParamList> | undefined;
  AdminOrders: undefined;
};

/** Root stack: every screen reachable from anywhere in the app. */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  SignIn: undefined;
  SignUp: undefined;
  Shop: {category?: string} | undefined;
  ProductDetails: {productId: string};
  Checkout: undefined;
  Orders: undefined;
  OrderDetails: {orderId: string};
  Admin: NavigatorScreenParams<AdminTabParamList> | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type AdminProductsScreenProps<T extends keyof AdminProductsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AdminProductsStackParamList, T>,
    AdminTabScreenProps<keyof AdminTabParamList>
  >;

// Types `useNavigation()` and `<Link screen=...>` across the app.
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
