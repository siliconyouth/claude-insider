/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* MODIFIED: Added comprehensive error logging for Vercel debugging */
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
    params: Promise.resolve({ segments: resolvedParams.segments || [] }),
    searchParams: Promise.resolve(resolvedSearchParams),
  });
};

const Page = async ({ params, searchParams }: Args) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Log to Vercel function logs
  console.log('=== PAYLOAD ADMIN DEBUG ===');
  console.log('Segments:', JSON.stringify(resolvedParams.segments));
  console.log('SearchParams:', JSON.stringify(resolvedSearchParams));
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('PAYLOAD_SECRET exists:', !!process.env.PAYLOAD_SECRET);

  try {
    const result = await RootPage({
      config,
      params: Promise.resolve({ segments: resolvedParams.segments || [] }),
      searchParams: Promise.resolve(resolvedSearchParams),
      importMap,
    });
    console.log('=== PAYLOAD ADMIN SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== PAYLOAD ADMIN ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2));
    throw error;
  }
};

export default Page;
