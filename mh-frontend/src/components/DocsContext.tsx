import React, { createContext, useContext, useState } from "react";

export interface Docs {
  cv: string;
  dars: (string | null)[];
}

const DocsCtx = createContext<Docs | null>(null);
const DocsSetter = createContext<((d: Docs) => void) | null>(null);

export const useDocs = () => useContext(DocsCtx);
export const useSetDocs = () => useContext(DocsSetter);

export const DocsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [docs, setDocs] = useState<Docs | null>(null);
  return (
    <DocsSetter.Provider value={setDocs}>
      <DocsCtx.Provider value={docs}>{children}</DocsCtx.Provider>
    </DocsSetter.Provider>
  );
};
