import { BookingForm } from "@/components/booking-form";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-4 bg-gradient-to-b from-green-50 to-background">
      <section className="text-center max-w-2xl mx-auto mb-10 space-y-4 pt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
          Dein Müll-Service für die Nachbarschaft
        </h1>
        <p className="text-xl text-muted-foreground">
          Ich stelle deine Tonnen raus – zuverlässig und einfach. Lehn dich zurück!
        </p>
      </section>

      <section className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-700">
        <BookingForm />
      </section>
    </div>
  );
}
