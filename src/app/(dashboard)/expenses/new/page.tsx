import ExpenseForm from "@/components/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Add Expense</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Enter the details of your expense.</p>
      <div className="mt-6 max-w-lg rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
        <ExpenseForm />
      </div>
    </div>
  );
}
