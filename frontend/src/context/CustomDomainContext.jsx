import { createContext, useContext } from 'react';

export const CustomDomainSlugContext = createContext(null);
export const CustomDomainInfoContext = createContext({});
export const useCustomDomainSlug = () => useContext(CustomDomainSlugContext);
export const useCustomDomainInfo = () => useContext(CustomDomainInfoContext);
