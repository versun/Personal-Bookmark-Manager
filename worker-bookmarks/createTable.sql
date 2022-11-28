/*createTable.sql*/
DROP TABLE IF EXISTS main;
CREATE TABLE main (title TEXT,url TEXT,tag TEXT,page INTEGER,description TEXT,note TEXT);
/*INSERT INTO main(title,url,tag,page,description,note) VALUES ('Google','https://www.google.com','#search #google',0,'first description','first note'),('Baidu','https://www.baidu.com','#search #baidu',1,'second description','second note');
*/