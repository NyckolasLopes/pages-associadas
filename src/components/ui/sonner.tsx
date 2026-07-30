import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-primary group-[.toaster]:border group-[.toaster]:border-slate-100 group-[.toaster]:border-l-4 group-[.toaster]:border-l-orange-500 group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group-[.toaster]:rounded-lg font-bold group-[.toaster]:min-w-[350px] group-[.toaster]:w-fit group-[.toaster]:max-w-[100vw]",
          description: "group-[.toast]:text-muted-foreground font-medium",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-bold rounded-md px-3 py-2 text-xs",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 font-bold rounded-md",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
