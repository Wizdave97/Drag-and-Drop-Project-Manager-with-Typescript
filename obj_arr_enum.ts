enum Role{ADMIN, READ_ONLY, AUTHOR}

const person={
    name:'Maximillian',
    age:30,
    hobbies:['Sports','Gaming'],
    role:Role.ADMIN
}

console.log(person.name)

if(person.role===Role.ADMIN){
    console.log('is admin')
}