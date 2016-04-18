/*
Author: Charlie Mathews (charles@parkes.io)
Date: 11/23/2015
Description: Empty database and create all tables/functions/triggers.
 
Notes
    - primary keys are pk_<tableName>
    - foreign keys are fk_<targetTable>_<sourceTable>
*/
 
-- DROP ALL TABLES
/*
IF OBJECT_ID('dbo.[workflowPath]', 'U') IS NOT NULL
  DROP TABLE [dbo].[workflowPath]
IF OBJECT_ID('dbo.[workflowPathResult]', 'U') IS NOT NULL
  DROP TABLE [dbo].[workflowPathResult]
IF OBJECT_ID('dbo.[workflowStage]', 'U') IS NOT NULL
  DROP TABLE [dbo].[workflowStage]
IF OBJECT_ID('dbo.[workflow]', 'U') IS NOT NULL
  DROP TABLE [dbo].[workflow]
IF OBJECT_ID('dbo.user', 'U') IS NOT NULL
  DROP TABLE [dbo].[user]
IF OBJECT_ID('workflowStage_delete') IS NOT NULL
  DROP TRIGGER workflowStage_delete
go
*/
IF OBJECT_ID('dbo.[user]', 'U') IS NOT NULL
  DROP TABLE [dbo].[user]
go
 
-- CREATE ALL TABLES
create table [dbo].[user]
(
  username varchar(40),
  box varchar(5),
  phone varchar(10),
  constraint pk_user primary key (username)
);

create table [dbo].[active_users]
(
  user varchar(40),
  token varchar(50),
  expires DATE,
  constraint pk_active_users primary key (token)
);

create table [dbo].[entry]
(
  owner varchar(40) NOT NULL,
  created DATE NOT NULL,
  sold DATE,
  author varchar(255),
  title varchar(255) NOT NULL,
  isbn varchar(13),
  edition varchar(12),
  condition varchar(7)
  constraint fk_user_entry foreign key (owner) references [user](username) on delete cascade on update cascade,
);

create table [dbo].[records]
(
  date DATE,
  type varchar(20),
  
);

/*
create table [dbo].[user]
(
username varchar(255) NOT NULL,
constraint pk_user primary key(username)
);
 
create table [dbo].[workflow]
(
name varchar(255) NOT NULL,
author varchar(255) NOT NULL,
constraint pk_workflow primary key(name),
constraint fk_user_workflow foreign key(author) references [user](username) on delete cascade on update cascade
);
 
create table [dbo].[workflowStage]
(
id int IDENTITY(1,1),
workflow varchar(255),
title varchar(255),
constraint pk_workflowStage primary key(id),
constraint fk_workflow_workflowStage foreign key(workflow) references [workflow](name) on delete cascade on update cascade
);
 
create table [dbo].[workflowPathResult]
(
result varchar(15),
constraint pk_workflowPathResult primary key(result)
);
*/