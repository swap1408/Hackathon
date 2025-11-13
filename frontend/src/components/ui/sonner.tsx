import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group z-[9999]"
      position="top-center"
      expand
      closeButton
      richColors
      duration={10000}
      toastOptions={{
        style: {
          fontSize: '1rem', // 16px
          lineHeight: 1.6,
          maxWidth: '640px',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:text-base group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-sm",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:text-sm",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
