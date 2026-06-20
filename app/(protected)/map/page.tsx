import { Metadata } from "next";
import { MapView } from "./map-view";

export const metadata: Metadata = {
  title: "Map",
  description: "Map of the world",
};

export default function MapPage() {
  return <MapView />;
}
