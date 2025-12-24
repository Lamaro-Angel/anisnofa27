import { useState } from "react";
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, useAcademicYears, useCreateAcademicYear } from "@/hooks/useClasses";
import { useSubjects, useCreateSubject, useDeleteSubject } from "@/hooks/useSubjects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Users, BookOpen, Calendar } from "lucide-react";

export default function Classes() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: academicYears } = useAcademicYears();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createAcademicYear = useCreateAcademicYear();

  const [newClass, setNewClass] = useState({ name: "", grade_level: "", room: "", capacity: 30 });
  const [newSubject, setNewSubject] = useState({ name: "", code: "", description: "", credits: 1 });
  const [newYear, setNewYear] = useState({ name: "", start_date: "", end_date: "", is_current: false });
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);

  const handleCreateClass = () => {
    createClass.mutate(newClass, {
      onSuccess: () => {
        setNewClass({ name: "", grade_level: "", room: "", capacity: 30 });
        setClassDialogOpen(false);
      },
    });
  };

  const handleCreateSubject = () => {
    createSubject.mutate(newSubject, {
      onSuccess: () => {
        setNewSubject({ name: "", code: "", description: "", credits: 1 });
        setSubjectDialogOpen(false);
      },
    });
  };

  const handleCreateYear = () => {
    createAcademicYear.mutate(newYear, {
      onSuccess: () => {
        setNewYear({ name: "", start_date: "", end_date: "", is_current: false });
        setYearDialogOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão Académica</h1>
        <p className="text-muted-foreground">Gerir turmas, disciplinas e anos letivos</p>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes" className="gap-2">
            <Users className="h-4 w-4" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Disciplinas
          </TabsTrigger>
          <TabsTrigger value="years" className="gap-2">
            <Calendar className="h-4 w-4" />
            Anos Letivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Turmas</CardTitle>
                <CardDescription>Lista de todas as turmas</CardDescription>
              </div>
              <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Turma
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Turma</DialogTitle>
                    <DialogDescription>Preencha os dados da turma</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={newClass.name}
                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                        placeholder="Ex: 10ºA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível</Label>
                      <Input
                        value={newClass.grade_level}
                        onChange={(e) => setNewClass({ ...newClass, grade_level: e.target.value })}
                        placeholder="Ex: 10º Ano"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Sala</Label>
                        <Input
                          value={newClass.room}
                          onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                          placeholder="Ex: Sala 101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacidade</Label>
                        <Input
                          type="number"
                          value={newClass.capacity}
                          onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 30 })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setClassDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateClass} disabled={!newClass.name || !newClass.grade_level}>
                      Criar Turma
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Capacidade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes?.map((cls) => (
                        <TableRow key={cls.id}>
                          <TableCell className="font-medium">{cls.name}</TableCell>
                          <TableCell>{cls.grade_level}</TableCell>
                          <TableCell>{cls.room || "-"}</TableCell>
                          <TableCell>{cls.student_count || 0}</TableCell>
                          <TableCell>{cls.capacity || 30}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar turma?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser revertida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteClass.mutate(cls.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {classes?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma turma encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Disciplinas</CardTitle>
                <CardDescription>Lista de todas as disciplinas</CardDescription>
              </div>
              <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Disciplina
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Disciplina</DialogTitle>
                    <DialogDescription>Preencha os dados da disciplina</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                        placeholder="Ex: Matemática"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Código</Label>
                        <Input
                          value={newSubject.code}
                          onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                          placeholder="Ex: MAT"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Créditos</Label>
                        <Input
                          type="number"
                          value={newSubject.credits}
                          onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={newSubject.description}
                        onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                        placeholder="Descrição opcional"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSubjectDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateSubject} disabled={!newSubject.name}>
                      Criar Disciplina
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {subjectsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects?.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>{subject.code || "-"}</TableCell>
                          <TableCell>{subject.credits || 1}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{subject.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar disciplina?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser revertida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSubject.mutate(subject.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subjects?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma disciplina encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="years">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Anos Letivos</CardTitle>
                <CardDescription>Configuração de anos letivos</CardDescription>
              </div>
              <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Ano Letivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Ano Letivo</DialogTitle>
                    <DialogDescription>Preencha os dados do ano letivo</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={newYear.name}
                        onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                        placeholder="Ex: 2024/2025"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={newYear.start_date}
                          onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Fim</Label>
                        <Input
                          type="date"
                          value={newYear.end_date}
                          onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_current"
                        checked={newYear.is_current}
                        onChange={(e) => setNewYear({ ...newYear, is_current: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="is_current">Definir como ano atual</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setYearDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateYear}
                      disabled={!newYear.name || !newYear.start_date || !newYear.end_date}
                    >
                      Criar Ano Letivo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Data de Fim</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYears?.map((year) => (
                      <TableRow key={year.id}>
                        <TableCell className="font-medium">{year.name}</TableCell>
                        <TableCell>{year.start_date}</TableCell>
                        <TableCell>{year.end_date}</TableCell>
                        <TableCell>
                          {year.is_current ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Atual
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {academicYears?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum ano letivo encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
