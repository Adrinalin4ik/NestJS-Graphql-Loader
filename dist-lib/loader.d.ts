/// <reference types="node" />
import { ExecutionContext } from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { IncomingMessage } from 'http';
import { SelectedUnionTypesResult } from './union-type-extractor';
export declare const LOADER_DECORATOR_NAME_METADATA_KEY = "LoaderPropertyDecorator";
export interface LoaderHelper<DtoType> {
    mapOneToManyRelation: (entities: object[], ids: any[], foreignKey: string) => [DtoType[]];
    mapOneToManyPolymorphicRelation: (entities: {
        descriminator: string;
        entities: object[];
    }[], typeIds: {
        descriminator: string | any;
        id: any;
    }, foreignKey?: string) => [DtoType[]];
    mapManyToOneRelation: (entities: object[], ids: any[], foreignKey?: string) => [DtoType[]];
}
export interface ILoaderInstance {
    _loader: {
        [key: string]: any;
    };
}
export interface LoaderData<DtoType, IdType> {
    name: string;
    parent: any;
    ids: IdType[];
    polimorphicTypes: IdType[];
    ctx: ExecutionContext;
    info: GraphQLResolveInfo;
    req: IncomingMessage & ILoaderInstance;
    helpers: LoaderHelper<DtoType>;
}
export interface PolymorphicLoaderData<DtoType, IdType, DescriminatorType> {
    name: string;
    parent: any;
    ids: {
        descriminator: DescriminatorType;
        id: IdType;
    };
    polimorphicTypes: {
        descriminator: DescriminatorType;
        ids: IdType[];
    }[];
    ctx: ExecutionContext;
    info: GraphQLResolveInfo;
    req: IncomingMessage & ILoaderInstance;
    helpers: LoaderHelper<DtoType>;
    selectedUnions: SelectedUnionTypesResult;
}
export interface GraphqlLoaderOptions {
    foreignKey?: string | ((parent: any) => any);
    polymorphic?: {
        id: string;
        descriminator: string;
    } | ((parent: any) => {
        id: any;
        descriminator: any;
    });
}
export declare const Loader: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const GraphqlLoader: (args?: GraphqlLoaderOptions) => (target: any, property: any, descriptor: any) => void;
export declare const mapOneToManyRelation: (entities: object[], ids: any[], foreignKey: any) => any[];
export declare const mapOneToManyPolymorphicRelation: (entities: {
    descriminator: string;
    entities: object[];
}[], typeIds: {
    descriminator: string | any;
    id: any;
}[], foreignKey?: string) => any[];
