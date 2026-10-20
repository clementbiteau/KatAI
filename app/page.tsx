import Link from "next/link";

const STEPS = [
  { title: "Read the brief", text: "A fictional client explains what they need, in their own words." },
  { title: "Write the spec", text: "Your model receives your specification and the expected function, never the brief." },
  { title: "Get scored", text: "The client's hidden acceptance tests run the generated code in your browser." },
];

export default function HomePage() {
  return (
    <main className="page home">
      <h1>Practice the spec, let the model write the code.</h1>
      <p className="lede">
        KatAI is a dojo for working with AI coding agents. Each kata is a client brief: turn it into a specification,
        and see how much of it your own model gets right.
      </p>
      <p className="home-actions">
        <Link href="/katas" className="button">
          Browse the katas
        </Link>
        <Link href="/randori" className="button button-secondary">
          Try a randori
        </Link>
      </p>
      <ol className="steps" aria-label="How a kata works">
        {STEPS.map((step) => (
          <li key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
