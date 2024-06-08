"use client";
import { Note as NoteModel1 } from "@prisma/client";
import { GSP_NO_RETURNED_VALUE } from "next/dist/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useState } from "react";
import AddEditNoteDialog from "./AddEditNoteDialog";

interface NoteProps{
    note: NoteModel1

}

export default function Note({note}: NoteProps){
    const [showEditDialog, setShowEditDialog] = useState(false);

    const wasUpdated = note.updatedAt > note.createdAt;


    const createdUpdatedAtTimeStamp = (
        wasUpdated ? note.updatedAt : note.createdAt//Uses updated at if wasUpdated was true otherwise uses createdAt
    ).toDateString();//Turns it into a readable form

   return(
    <>
    <Card className = "cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowEditDialog(true)}
      >
        <CardHeader>
            <CardTitle>
                {note.title}
            </CardTitle>
            <CardDescription>
                {createdUpdatedAtTimeStamp}
                {wasUpdated && "(updated)"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className = "whitespace-pre-line">
            {note.content}
            </p>
        </CardContent>
    </Card>
    <AddEditNoteDialog 
    open = {showEditDialog}
    setOpen= {setShowEditDialog}
    noteToEdit = {note}
    />
</>
   )
}