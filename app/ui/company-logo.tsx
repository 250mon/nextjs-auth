import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import { getPathWithBasePath } from '@/app/lib/utils';

export default function CompanyLogo({ 
  companyName, 
  variant = 'default' 
}: { 
  companyName?: string;
  variant?: 'default' | 'compact';
}) {
  const isCompact = variant === 'compact';
  
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image 
        src={getPathWithBasePath("/danaul-logo-blue-sm.png")} 
        alt="Danaul Logo" 
        width={isCompact ? 40 : 48} 
        height={isCompact ? 40 : 48} 
        className={isCompact ? "mr-2" : "mr-3"} 
      />
      <p className={isCompact 
        ? "text-[20px] md:text-[28px] whitespace-nowrap md:whitespace-normal" 
        : "text-[24px] md:text-[32px] lg:text-[44px]"
      }>
        {companyName || "Danaul"} Auth
      </p>
    </div>
  );
}
