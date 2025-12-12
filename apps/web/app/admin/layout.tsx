/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { ServerFunctionClient } from 'payload';
import config from '@payload-config';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import '@payloadcms/next/css';

import { importMap } from './[[...segments]]/importMap';

type Args = {
  children: React.ReactNode;
};

const serverFunctions: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

const AdminLayout = async ({ children }: Args) => {
  return RootLayout({
    children,
    config,
    importMap,
    serverFunction: serverFunctions,
  });
};

export default AdminLayout;
