import Image from "next/image";
import { cn } from "@/lib/utils";

const customers = [
  { name: "GitHub", src: "/customers/github.png", width: 512, height: 512, invertOnDark: true },
  { name: "Google", src: "/customers/google.png", width: 502, height: 512 },
  { name: "Laravel", src: "/customers/laravel.png", width: 497, height: 512 },
  { name: "Netflix", src: "/customers/netflix.png", width: 283, height: 512 },
  { name: "Nike", src: "/customers/nike.png", width: 512, height: 182, invertOnDark: true },
  { name: "NVIDIA", src: "/customers/nvidia.png", width: 512, height: 397 },
  { name: "OpenAI", src: "/customers/openai.png", width: 296, height: 300, invertOnDark: true },
  { name: "React", src: "/customers/react.png", width: 512, height: 456 },
];

export function CustomersSection() {
  return (
    <section className="bg-background pb-16 pt-16 md:pb-32">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">Trusted by teams at</p>

        <div className="mt-8 grid grid-cols-2 items-center gap-x-8 gap-y-8 sm:grid-cols-4 sm:gap-x-10">
          {customers.map((customer) => (
            <div key={customer.name} className="flex h-14 items-center justify-center">
              <Image
                src={customer.src}
                alt={`${customer.name} logo`}
                width={customer.width}
                height={customer.height}
                className={cn(
                  "h-10 w-auto max-w-full object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0",
                  customer.invertOnDark && "dark:invert"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
