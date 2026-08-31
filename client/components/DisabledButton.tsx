import { ReactNode } from 'react';

export default (
  { children, disabled, ...rest }: {
    children: ReactNode;
    disabled: boolean;
    onClick?: () => unknown;
  },
) => <button {...disabled ? { disabled } : rest}>{disabled ? 'Betöltés...' : children}</button>;
