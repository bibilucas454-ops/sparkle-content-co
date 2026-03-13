import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground w-full">
      <span>&copy; {new Date().getFullYear()} CreatorOS</span>
      <div className="flex gap-4 mt-4 md:mt-0">
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Política de Privacidade
        </Link>
        <span className="cursor-pointer hover:text-foreground transition-colors">
          Termos de Uso
        </span>
      </div>
    </footer>
  );
}
