import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { getEmbedding } from "@/lib/openai";
import { createNoteSchema, deleteNoteSchema, updateNoteSchema } from "@/lib/validation/note";
import { auth } from "@clerk/nextjs";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      //If validation fails
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parseResult.data;

    const { userId } = auth();

    if (!userId) {
      //If there is no userID associated with the note
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const embedding = await getEmbeddingForNote(title, content);

    const note = await prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title,
          content,
          userId,
        },
      });
      await notesIndex.upsert([
        {
        id: note.id,
        values: embedding,
        metadata: { userId },
      },
    ]);//Creates or updates an entry in pinecone

      return note;
    })//Creates a transaction, meaning that if any operation fails it rolls back all MongoDB operations to before the transaction



    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  //FOR UPDATE REQUEST ROUTE
  try {
    const body = await req.json();

    const parseResult = updateNoteSchema.safeParse(body);

    if (!parseResult.success) {
      //If validation fails
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, title, content } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if(!note){
        return Response.json({ error: "Note not found" }, { status: 404 });
    }
    const { userId } = auth();

    if (!userId|| userId!==note.userId) {//If there is no userID associated with the note
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const embedding = await getEmbeddingForNote(title, content);

    const updatedNote = await prisma.$transaction(async (tx) =>{
      const updatedNote = await tx.note.update({
        where: {id}, 
        data: {
            title,
            content,
        },
    });

    await notesIndex.upsert([{
      id,
      values: embedding,
      metadata: {userId},
    },
  ]);

    return updatedNote;
    });


  

    return Response.json({ updatedNote}, { status: 200 });


  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function DELETE(req: Request) {//HTDP METHODS very specific function names
    try {
      const body = await req.json();
  
      const parseResult = deleteNoteSchema.safeParse(body);
  
      if (!parseResult.success) {
        //If validation fails
        console.error(parseResult.error);
        return Response.json({ error: "Invalid input" }, { status: 400 });
      }
  
      const { id} = parseResult.data;
  
      const note = await prisma.note.findUnique({ where: { id } });
  
      if(!note){
          return Response.json({ error: "Note not found" }, { status: 404 });
      }
      const { userId } = auth();
  
      if (!userId|| userId!==note.userId) {//If there is no userID associated with the note
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      await prisma.$transaction(async (tx) => {
        await tx.note.delete({where: {id}});
        await notesIndex.deleteOne(id);

      });

      return Response.json({ message: "Note Deleted"}, { status: 200 });
  
  
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

async function getEmbeddingForNote(title: string, content: string|undefined){
  return getEmbedding(title + "\n\n" + content ?? "");//?? means if content is undefined it instead uses an empty string

}

