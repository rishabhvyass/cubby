import { createNavigationContainerRef } from "@react-navigation/native";

/** Lets code outside screens (e.g. the wallet connection layer) navigate. */
export const navigationRef = createNavigationContainerRef<any>();
