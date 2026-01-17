import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
import { getPathWithBasePath } from '@/app/lib/utils';

export default function CompanyLogo({ companyName }: { companyName?: string }) { return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image 
        src={getPathWithBasePath("/danaul-logo-blue-sm.png")} 
        alt="Danaul Logo" 
        width={48} 
        height={48} 
        className="mr-3" 
      />
      <p className="text-[24px] md:text-[32px] lg:text-[44px]">{companyName || "Danaul"}</p>
    </div>
  );
}
