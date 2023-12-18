'use server'

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number()
  .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'],{
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is temporary until @types/react-dom is updated
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// INSEART INVOICE SERVER ACTION
export async function createInvoice(preState:State,formData:FormData){
  // const rawFormData = Object.fromEntries(formData.entries()); // extract the from data from Action
  const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }else{  
    const { customerId, amount, status } = validatedFields.data;
    const USD_TO_CENTS = 100;
    const amountInCents = amount * USD_TO_CENTS;//convert usd to cents
    const date = new Date().toISOString().split('T')[0]; // EX: '2023-12-14'
    
    // Insert data into the database
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
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