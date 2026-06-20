"use client";

import { useState } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from "@/components/ui/map";
import { Card } from "@/components/ui/card";
import citysuperData from "./citysuper.json";

type UserLocation = {
  longitude: number;
  latitude: number;
};

type CitysuperStore = {
  name: string;
  mall: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  storeType: "main" | "logon";
};

const stores: CitysuperStore[] = [
  ...citysuperData.citysuper_stores.main_stores.map((store) => ({
    ...store,
    storeType: "main" as const,
  })),
  ...citysuperData.citysuper_stores.logon_popup_stores.map((store) => ({
    ...store,
    storeType: "logon" as const,
  })),
];

export function MapView() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  return (
    <Card className="h-screen p-0 overflow-hidden">
      <Map center={[114.17, 22.3]} zoom={10.5}>
        {stores.map((store) => {
          const isLogon = store.storeType === "logon";
          return (
            <MapMarker
              key={store.name}
              longitude={store.coordinates.longitude}
              latitude={store.coordinates.latitude}
            >
              <MarkerContent>
                <div
                  className={`overflow-hidden shadow-lg ring-2 ring-white rounded-full`}
                >
                  <img
                    src={isLogon ? "/log-on_logo.png" : "/citysuper_icon.jpeg"}
                    alt=""
                    className="size-8 object-cover"
                  />
                </div>
              </MarkerContent>
              <MarkerTooltip>
                <div className="space-y-0.5 text-xs">
                  {/* <div className="font-medium">{store.name}</div> */}
                  <div className="text-background/80">{store.mall}</div>
                  {/* <div className="text-background/60 text-[11px]">
                  {store.address}
                </div> */}
                </div>
              </MarkerTooltip>
            </MapMarker>
          );
        })}
        {userLocation && (
          <MapMarker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
          >
            <MarkerContent>
              <div className="relative flex items-center justify-center">
                <div className="absolute size-6 animate-ping rounded-full bg-cyan-500/20" />
                <div className="size-4 rounded-full border-2 border-white bg-cyan-500 shadow-lg" />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <div className="text-center">
                <div className="font-medium">Your location</div>
              </div>
            </MarkerTooltip>
          </MapMarker>
        )}
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
          onLocate={setUserLocation}
        />
      </Map>
    </Card>
  );
}
