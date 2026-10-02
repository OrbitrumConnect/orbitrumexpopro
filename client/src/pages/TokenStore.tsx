import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function TokenStore() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation('/planos'); }, [setLocation]);
  return null;
}
