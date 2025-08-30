"use client";

import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdAppWrapper, ConfigProvider } from "antd";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "./auth-provider";
import { dataProvider } from "./data-provider";

export function LoginRefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <RefineKbarProvider>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#8B0000",
            borderRadius: 4,
          },
        }}
      >
        <AntdAppWrapper>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider()}
            authProvider={authProvider}
            resources={[]} // No resources needed for login
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: false,
              projectId: "grimforge-admin",
            }}
          >
            {children}
            <RefineKbar />
          </Refine>
        </AntdAppWrapper>
      </ConfigProvider>
    </RefineKbarProvider>
  );
}
