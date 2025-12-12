/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next';
import config from '@payload-config';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from './importMap';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return generatePageMetadata({
    config,
    params: { segments: resolvedParams.segments || [] },
    searchParams: resolvedSearchParams,
  });
};

const Page = async ({ params, searchParams }: Args) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  return RootPage({
    config,
    params: { segments: resolvedParams.segments || [] },
    searchParams: resolvedSearchParams,
    importMap,
  });
};

export default Page;
