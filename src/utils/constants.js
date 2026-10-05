export const UserRolesEnum={
    ADMIN:"admin",
    PROJECT_ADMIN:"project_admin",
    MEMBER:"member"
}
export const AvailableUserRole=Object.values(UserRolesEnum);

export const TaskStatusEnum={
    IN_PROGRESS:"in_progress",
    TODO:"todo",
    DONE:"done"
}
export const AvailableTaskStatus=Object.values(TaskStatusEnum);