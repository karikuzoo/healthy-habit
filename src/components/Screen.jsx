import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Wrapper layar: safe area + warna latar konsisten.
 * `edges` default hanya 'top' karena bagian bawah sudah diurus tab bar.
 */
export function Screen({ children, className = "", edges = ["top"] }) {
  return (
    <SafeAreaView
      edges={edges}
      className={`pt-4 flex-1 bg-surface-muted ${className}`}
    >
      {children}
    </SafeAreaView>
  );
}

export default Screen;
