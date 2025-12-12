/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next';
import config from '@payload-config';
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views';
import { importMap } from './importMap';

export const generateMetadata = async (): Promise<Metadata> => {
  return generatePageMetadata({
    config,
    params: Promise.resolve({ segments: ['not-found'] }),
    searchParams: Promise.resolve({}),
  });
};

const NotFound = async () => {
  return NotFoundPage({
    config,
    params: Promise.resolve({ segments: ['not-found'] }),
    searchParams: Promise.resolve({}),
    importMap,
  });
};

export default NotFound;
