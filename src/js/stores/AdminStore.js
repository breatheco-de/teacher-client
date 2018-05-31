/* global localStorage */
import Flux from '@4geeksacademy/react-flux-dash';

class AdminStore extends Flux.DashStore{
    constructor(){
        super();
        
        this.state = {
            user: []
        };
        
        // Or Declare an event with some transformation logic
        this.addEvent("manage_student", this._transformStudents.bind(this));
    }
    
    _transformStudents(results){ return results; }
    
    getSingle(type, id){ 
        let entities = this.getAll(type);
        let results = entities.filter((ent) => ent.id == id); 
        if(results.length === 1) return results[0];
        else if(results.length === 0) return null;
        else if(results.length >1) throw new Error(`There seems to be more than one ${type} with the id: ${id}`);
    }
    getSingleBy(type, key, value){ 
        let entities = this.getAll(type);
        let results = entities.filter((ent) => ent[key] == value); 
        if(results.length === 1) return results[0];
        else if(results.length === 0) return null;
        else if(results.length >1) throw new Error(`There seems to be more than one ${type} with the ${key}: ${value}`);
    }
    getAll(type){ 
        let result = this.getState();
        if(typeof result[`manage_${type}`] === 'undefined') return [];
        else return result[`manage_${type}`];
    }
    replace(type, newEntity){
        if(!newEntity || typeof newEntity.id == 'undefined') throw new Error(`Invalid ${type} to replate`);
        let entities = this.getAll(type);
        return entities.map((ent) => (ent.id !== newEntity.id) ? ent : newEntity); 
    }
    
}
export default new AdminStore();