import { RAFFLE_DATE_LABEL, INSTAGRAM_URL } from "@/features/raffle/constants";

export function RaffleFooter() {
  return (
    <footer className="px-4 py-9 text-center text-xs leading-relaxed text-carvao/60">
      <p>
        <strong className="text-verde-escuro">Gatil Irmã Francisca</strong> · 10
        anos cuidando de quem não tem voz.
      </p>
      <p>
        Sorteio ao vivo no Instagram, dia {RAFFLE_DATE_LABEL}. Dúvidas? Fale com a gente pelo{" "}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline">
          Instagram
        </a>
        .
      </p>
      <p>Esta é uma ação solidária oficial do Gatil Irmã Francisca — CNPJ 25.382.038/0001-05.</p>
    </footer>
  );
}