
interface Project{
  title:string;
  id:number;
  people:string;
  description:string;
  projectStatus:number;
  status:number;
  render(rootEl:HTMLElement):void;
}
interface Draggable{
  onDragStart(e:DragEvent):void;
  onDragEnd(e:DragEvent):void;
}
interface Droppable{
  allowDrop(e:DragEvent):void;
  onDragEnter(e:DragEvent):void;
  onDrop(e:DragEvent):void;
  onDragLeave(e:DragEvent):void;
}
interface Component{
  templateId:string;
  contentId:string;
  renderContent():void;
  configure():void;
  render():void;
}
interface IProjectInput extends Component{
  titleInputElement:HTMLInputElement;
  peopleInputElement:HTMLInputElement;
  descriptionInputElement:HTMLInputElement;
  title:string;
  people:string;
  description:string;
  addProject(e:Event):void;
  handleChange(e:Event):void;
  __proto__?:object;
}
interface IProjectList extends Component{
  type:number;
  listEl:HTMLUListElement;
}
/*

Decorator Functions

*/
function AutoBind(target:any,methodName:string,propertyDescriptor:PropertyDescriptor):PropertyDescriptor{
    const originalMethod=propertyDescriptor.value;
    const adjDescriptor:PropertyDescriptor={
        enumerable:false,
        configurable:true,
        get(){
            const boundFn=originalMethod.bind(this)
            return boundFn
        }
    }
    return adjDescriptor
}
type ValidationConfig={
    [objName:string]:{
        [prop:string]:number[]
    }
}
type ErrorContainer={
    [prop:string]:string[];
}

enum ValidationOptions{REQUIRED,POSITIVE_NUMBER,STRING}
const validationRegistry:ValidationConfig={}
// Validation decorators
function Required(target:any,propName:string){
    let objName:string=target.constructor.name;
    if(validationRegistry[objName] && validationRegistry[objName][propName] instanceof Array){
        validationRegistry[objName][propName].push(ValidationOptions.REQUIRED)
    }
    else{
        if(validationRegistry[objName]){
            validationRegistry[objName]={...validationRegistry[objName],[propName]:[ValidationOptions.REQUIRED]}
        }
        else{
            validationRegistry[objName]={[propName]:[ValidationOptions.REQUIRED]}
        }
    }
}
function PositiveNumber(target:any,propName:string){
    let objName:string=target.constructor.name;
    if(validationRegistry[objName] && validationRegistry[objName][propName] instanceof Array){
        validationRegistry[objName][propName].push(ValidationOptions.POSITIVE_NUMBER)
    }
    else{
        if(validationRegistry[objName]){
            validationRegistry[objName]={...validationRegistry[objName],[propName]:[ValidationOptions.POSITIVE_NUMBER]}
        }
        else{
            validationRegistry[objName]={[propName]:[ValidationOptions.POSITIVE_NUMBER]}
        }
    }
}

function IsString(target:any,propName:string){
    let objName:string=target.constructor.name;
    if(validationRegistry[objName] && validationRegistry[objName][propName] instanceof Array){
        validationRegistry[objName][propName].push(ValidationOptions.STRING)
    }
    else{
        if(validationRegistry[objName]){
            validationRegistry[objName]={...validationRegistry[objName],[propName]:[ValidationOptions.STRING]}
        }
        else{
            validationRegistry[objName]={[propName]:[ValidationOptions.STRING]}
        }
    }
}
function validate(obj:Partial<IProjectInput>){
    const errors:ErrorContainer={}
    const objName=obj.__proto__!.constructor.name;
    let check:any
    for(let key  in obj){
        errors[key]=[]
        if(validationRegistry[objName] && validationRegistry[objName][key]){
            for(let option of validationRegistry[objName][key]){
                switch(option){
                    case ValidationOptions.REQUIRED:
                        check=typeof (obj[key as keyof IProjectInput ]! as string).trim() === 'string' && (obj[key as keyof IProjectInput]! as string).length>0?true:errors[key].push('Field is required')
                        break;
                    case ValidationOptions.POSITIVE_NUMBER:
                        check=typeof +(obj[key as keyof IProjectInput ]! as string).trim() === 'number' && +obj[key as keyof IProjectInput]!>=0?true:errors[key].push('Must be a positive number')
                        break;
                    case ValidationOptions.STRING:
                        check=typeof (obj[key as keyof IProjectInput ]! as string).trim()  === 'string' && (obj[key as keyof IProjectInput]! as string).trim().length>0?true:errors[key].push('Must be a string')
                        break;
                }
            }
        }
    }
    return errors
}
enum Status{ACTIVE,COMPLETED}
class Store<T extends IProjectList>{
    store:Project[]=[];
    prevSize:number=0;
    size:number=0;
    subscribers:T[]=[];
    constructor(){
        this.watch()
    }
    set storeSize(val:number){
        this.size=val
    }
    get storeSize(){
        return this.size
    }
    set previousSize(val:number){
        this.prevSize=val
    }
    get previousSize(){
        return this.prevSize;
    }
    subscribe(entity:T){
        this.subscribers.push(entity)
    }
    getState(){
        return this.store
    }
    push(item:Project){
        const oldState=this.getState();
        const newState=[...oldState];
        newState.push(item);
        this.setState(newState);
    }
    moveProject(id:number){
      let store=this.getState();
      store.map((project)=>{
        if(project.id===id){
          project.status===Status.ACTIVE?project.projectStatus=Status.COMPLETED:project.projectStatus=Status.ACTIVE
        }
      })
    }
    setState(arr:Project[]){
        this.previousSize=this.storeSize;
        this.store.splice(0,this.store.length);
        this.store=[...arr];
        this.storeSize=this.store.length;
    }
    async watch(){
        setInterval(()=>{
          console.log('[CHECKING FOR RENDERING]')
            if(this.storeSize !== this.previousSize){
                this.subscribers.map((subscriber:T)=>{
                    console.log('[RENDERING]')
                    subscriber.render()
                })
                this.previousSize=this.storeSize
            }
        },350)
    }
}
const store=new Store<IProjectList>();
class IProject implements Project,Draggable{

  id:number=store.storeSize;
  status:number=Status.ACTIVE;
  clone:Node;
  constructor(public title:string,public people:string,public description:string){
    if('content' in document.createElement('template')){
      let template=document.getElementById('single-project')! as HTMLTemplateElement;
      template.content.firstElementChild!.id=this.id.toString();

      template.content.querySelector('h3')!.textContent=people + ' assigned';
      template.content.querySelector('h2')!.textContent=title;
      template.content.querySelector('p')!.textContent=description;
      let clone=template.content.cloneNode(true);
      this.clone=clone;
    }
    else{
      this.clone=new Node();
      alert('Update your browser to run this app')
    }
  }

  set projectStatus(val:number){
    this.status=val;
  }
  get projectStatus(){
    return this.status;
  }
  @AutoBind
  onDragEnd(e: DragEvent): void {

  }
  @AutoBind
  onDragStart(e: DragEvent): void {
      e.dataTransfer!.setData('text',(e.target! as HTMLElement).id)
  }
  render(rootEl:HTMLElement):void{
    rootEl.appendChild(this.clone);
    document.getElementById(this.id.toString())!.addEventListener('dragstart',this.onDragStart);
  }
}
abstract class Comp implements Component{
    templateId: string;
    constructor(templateId:string,public contentId:string){
      this.templateId=templateId;
      this.renderContent();
    }
    renderContent(): void {
        if('content' in document.createElement('template')){
          const app=document.getElementById('app')! as HTMLDivElement;
          let template=document.getElementById(this.templateId)! as HTMLTemplateElement;
          template.content.firstElementChild!.id=this.contentId
          let clone=template.content.cloneNode(true);
          app.appendChild(clone)
        }
        else{
          alert('Update your browser to run this app')
        }
    }
    abstract render():void
    abstract configure():void
}
class ProjectInput extends Comp implements IProjectInput{

    peopleInputElement: HTMLInputElement;
    @Required
    description: string='';
    @Required
    @PositiveNumber
    people: string='';
    @Required
    title: string='';
    descriptionInputElement: HTMLInputElement;
    titleInputElement: HTMLInputElement;
    formElement:HTMLFormElement;
    constructor(templateId:string,contentId:string){
      super(templateId,contentId)
      this.titleInputElement=document.getElementById('title')! as HTMLInputElement;
      this.peopleInputElement=document.getElementById('people')! as HTMLInputElement;
      this.descriptionInputElement=document.getElementById('description')! as HTMLInputElement;
      this.formElement=document.getElementById(this.contentId)! as HTMLFormElement;
      this.configure()
    }
    @AutoBind
    handleChange(e: Event): void {
      let target=e.target! as HTMLInputElement
      let id=target.id;
      this[id as 'title'|'people'|'description']=target.value;
    }

    render(): void {
        throw new Error("Method not implemented.");
    }
    configure(): void {
      this.titleInputElement.addEventListener('change',this.handleChange)
      this.peopleInputElement.addEventListener('change',this.handleChange)
      this.descriptionInputElement.addEventListener('change',this.handleChange)
      this.formElement.addEventListener('submit',this.addProject)
    }
    @AutoBind
    addProject(e: Event): void {
      e.preventDefault();
      let errors=validate(this);
      for(let key in errors){
        if(errors[key].length>0){
          return alert('Invalid Inputs\n'+Object.keys(errors).map((key)=>{
              if(['title','description','people'].indexOf(key as string) >-1){
                return key+':'+errors[key].join(',')
              }
          }).filter((val)=>Boolean(val)).join('\n'))
        }
      }
      store.push(new IProject(this.title,this.people,this.description))
      this.clearForm()
    }
    clearForm():void{
      this.titleInputElement.value='';
      this.peopleInputElement.value='';
      this.descriptionInputElement.value='';
      this.title='';
      this.description='';
      this.people='';
    }

}
class ProjectList extends Comp implements IProjectList,Droppable{

    listEl:HTMLUListElement;
    constructor(templateId:string,contentId:string,public type:number){
      super(templateId,contentId)
      this.listEl=(document.getElementById(this.contentId)! as HTMLDivElement).querySelector('ul')!;
      this.configure()
    }

    configure(): void {
        let rootElement=document.getElementById(this.contentId)! as HTMLDivElement;
        rootElement.addEventListener('dragover',this.allowDrop);
        rootElement.addEventListener('dragenter',this.onDragEnter);
        rootElement.addEventListener('dragleave',this.onDragLeave);
        rootElement.addEventListener('drop',this.onDrop);
        let header=rootElement.querySelector('header')!.querySelector('h2')! as HTMLHeadElement;
        if(this.type===Status.ACTIVE) {
          header.textContent='Active Projects'
        }
        else {
          header.textContent='Completed Projects';
        }

    }

    render(): void {
      let projects=store.getState();
      projects.map((project)=>{
        if(project.status===this.type){
          project.render(this.listEl)
        }
      })
    }
    @AutoBind
    onDragLeave(e: DragEvent): void {
      this.listEl!.parentElement!.classList.toggle('droppable')
    }
    @AutoBind
    onDrop(e: DragEvent): void {
      e.preventDefault();
      let data=e.dataTransfer!.getData('text');
      console.log(data)
      this.listEl.appendChild(document.getElementById(data)!);
      this.listEl!.parentElement!.classList.remove('droppable')
      store.moveProject(+data);
    }
    @AutoBind
    onDragEnter(e: DragEvent): void {
        this.listEl!.parentElement!.classList.toggle('droppable')
    }
    @AutoBind
    allowDrop(e: DragEvent): void {
        e.preventDefault();
    }

}
window.addEventListener('DOMContentLoaded',function(){
  const projectInput=new ProjectInput('project-input','user-input')
  const list1=new ProjectList('project-list','unfinished-projects',Status.ACTIVE)
  const list2=new ProjectList('project-list','finished-projects',Status.COMPLETED)
  store.subscribe(list1);
  store.subscribe(list2);
})
