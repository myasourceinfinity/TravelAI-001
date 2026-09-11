import { useEffect } from 'react';

const TIDIO_SCRIPT_ID = 'travel-ai-tidio-script';
const TIDIO_SCRIPT_URL = `https://code.tidio.co/${import.meta.env.VITE_TIDIO_PUBLIC_KEY || 'pb9eycxl7gcdmijgtp0smwuiswvi5bj1'}.js`;

export default function TidioWidget({ user }) {
  useEffect(() => {
    const updateVisitor = () => {
      if (!window.tidioChatApi) return;
      window.tidioChatApi.setVisitorData?.({
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : undefined,
        email: user?.email,
        phone: user?.phone,
      });
    };

    const existing = document.getElementById(TIDIO_SCRIPT_ID);
    if (!existing) {
      const script = document.createElement('script');
      script.id = TIDIO_SCRIPT_ID;
      script.src = TIDIO_SCRIPT_URL;
      script.async = true;
      script.onload = updateVisitor;
      document.body.appendChild(script);
    } else {
      updateVisitor();
    }
  }, [user]);

  return null;
}
