'use server'

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// INSEART INVOICE SERVER ACTION
export async function createInvoice(formData:FormData){
  try {
    const rawFormData = Object.fromEntries(formData.entries()); // extract the from data from Action
    const {customerId,status,amount} = CreateInvoice.parse(rawFormData); // validate form data
    const USD_TO_CENTS = 100;
    const amountInCents = amount * USD_TO_CENTS;//convert usd to cents
    const date = new Date().toISOString().split('T')[0]; // EX: '2023-12-14'

    // insert Data in DB
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `

  } catch (error) {

    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  revalidatePath('/dashboard/invoices');// refresh page remove cache
  redirect('/dashboard/invoices');
}

// UPDATE INVOICE SERVER ACTION
export async function updateInvoice(id: string, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries()); // extract the from data from Action
    const {customerId,status,amount} = CreateInvoice.parse(rawFormData); // validate form data
  
    const amountInCents = amount * 100;
  
    // update invoice query
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
  revalidatePath('/dashboard/invoices');// refresh page remove cache
  redirect('/dashboard/invoices');
}

// DELETE INVOICE FROM DB SERVER ACTION
export async function deleteInvoice(id: string) {
  throw Error("Error While Deleting Invoice")
  try {
    // delete invoice query
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    revalidatePath('/dashboard/invoices');// refresh page remove cache

    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}