import { users } from "../MockData/Users";

function getUserFromId(id) {
    return users.find(user => user.id === id) || null;
}

export default getUserFromId;